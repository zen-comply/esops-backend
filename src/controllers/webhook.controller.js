import { Op } from 'sequelize';
import db from '../config/database.js';
import logger from '../logger.js';
import SigneasyService from '../services/signeasy.service.js';
import { createFileObject, uploadFileToS3 } from '../utils/file.utils.js';

const SIGNED_EVENT_MARKERS = ['signed', 'completed', 'complete'];

const isSignedEvent = (eventName, status) => {
    const candidate = `${eventName || ''} ${status || ''}`.toLowerCase();
    return SIGNED_EVENT_MARKERS.some((marker) => candidate.includes(marker));
};

const extractIds = (payload) => {
    const data = payload?.data || {};
    const envelopeId =
        payload?.envelope_id ||
        payload?.envelopeId ||
        payload?.envelope?.id ||
        payload?.id ||
        payload?.message?.envelope_id ||
        data?.id ||
        null;
    const originalId =
        payload?.original_id ||
        payload?.originalId ||
        payload?.original?.id ||
        payload?.source_id ||
        payload?.sourceId ||
        payload?.message?.original_id ||
        data?.sources?.[0]?.id ||
        null;

    return { envelopeId, originalId };
};

const extractEventInfo = (payload) => {
    const data = payload?.data || {};
    const metadata = payload?.metadata || {};
    const eventName =
        payload?.event ||
        payload?.event_type ||
        payload?.type ||
        payload?.message?.event ||
        metadata?.event_type ||
        null;
    const status =
        payload?.status ||
        payload?.message?.status ||
        payload?.document_status ||
        data?.status ||
        null;
    return { eventName, status };
};

const extractSignedFileId = (payload) => {
    const data = payload?.data || {};
    const recipientSignedId = data?.recipients?.[0]?.signed_file_id || null;
    return (
        data?.signed_file_id ||
        payload?.signed_file_id ||
        recipientSignedId ||
        null
    );
};

const buildJsonMatch = (path, value) => {
    if (!value) return null;
    return db.sequelize.where(
        db.sequelize.literal(
            `JSON_UNQUOTE(JSON_EXTRACT(signEasy, '$.${path}'))`
        ),
        value
    );
};

const addSignedSuffix = (name) => {
    if (!name) return name;
    if (name.includes('_signed')) return name;
    const dotIndex = name.lastIndexOf('.');
    if (dotIndex === -1) return `${name}_signed`;
    const base = name.slice(0, dotIndex);
    const ext = name.slice(dotIndex);
    return `${base}_signed${ext}`;
};

const upsertSignedFile = async ({ grant, buffer, fileName, suffix }) => {
    if (!buffer) return null;

    const fileModel = db.models.File;
    const likePattern = suffix ? `${suffix}%` : 'grant-letter-%';
    const nameFilter = suffix
        ? { [Op.like]: likePattern }
        : {
              [Op.like]: likePattern,
              [Op.notLike]: 'grant-letter-audit-%',
          };
    const existingFile = await fileModel.findOne({
        where: {
            fileFor: 'grant',
            fileForId: grant.id,
            name: nameFilter,
        },
        tenant_safe: true,
    });

    const baseName =
        fileName || existingFile?.name || `grant-letter-${grant.id}.pdf`;
    const targetName = addSignedSuffix(baseName);
    const fileObject = createFileObject(
        buffer,
        targetName,
        'application/pdf',
        buffer.length
    );

    const s3Key = `organisations/${grant.OrganisationId}/grants/${grant.id}/${targetName}`;
    const s3Bucket = existingFile?.s3Bucket || process.env.S3_BUCKET_NAME;

    fileObject.s3Key = s3Key;
    fileObject.s3Bucket = s3Bucket;

    const s3Response = await uploadFileToS3(
        fileObject,
        s3Bucket,
        s3Key,
        process.env.MAX_FILE_SIZE,
        ['pdf']
    );

    if (!s3Response) {
        throw new Error('Failed to upload signed file to S3');
    }

    if (existingFile) {
        await existingFile.update(
            {
                name: targetName,
                size: buffer.length,
                mimeType: 'application/pdf',
                s3Bucket,
                s3Key,
            },
            { hooks: false, tenant_safe: true }
        );
        return existingFile;
    }

    return await fileModel.create({
        name: targetName,
        s3Key,
        s3Bucket,
        fileFor: 'grant',
        fileForId: grant.id,
        size: buffer.length,
        mimeType: 'application/pdf',
    });
};

export const handleSigneasyWebhook = async (req, res) => {
    try {
        const payload = req.body || {};
        const eventPayload =
            payload?.payload && typeof payload.payload === 'object'
                ? payload.payload
                : payload;
        const { envelopeId, originalId } = extractIds(eventPayload);
        const { eventName, status } = extractEventInfo(eventPayload);

        const whereClauses = [
            buildJsonMatch('requestId', envelopeId),
            buildJsonMatch('documentId', originalId),
        ].filter(Boolean);

        if (whereClauses.length === 0) {
            logger.warn('Signeasy webhook: missing envelope/original id');
            return res.sendSuccess({ received: true });
        }

        const grant = await db.models.Grant.findOne({
            where: {
                [Op.or]: whereClauses,
            },
            tenant_safe: true,
        });

        if (!grant) {
            logger.warn(
                `Signeasy webhook: grant not found for envelope ${envelopeId} original ${originalId}`
            );
            return res.sendSuccess({ received: true });
        }

        const options = { tenant_id: grant.OrganisationId };

        const existingSignEasy =
            grant.signEasy && typeof grant.signEasy === 'object'
                ? grant.signEasy
                : {};

        let updatePayload = {
            ...existingSignEasy,
            webhookEvent: eventName || existingSignEasy.webhookEvent || null,
            status: status || existingSignEasy.status || null,
            lastWebhookAt: new Date().toISOString(),
            payload: eventPayload,
        };

        if (isSignedEvent(eventName, status)) {
            const signeasyService = new SigneasyService(req);
            const signedFileId = extractSignedFileId(eventPayload);

            let signedFile = null;

            if (signedFileId) {
                const signedBuffer =
                    await signeasyService.downloadSignedFileById(signedFileId);
                signedFile = await upsertSignedFile({
                    grant,
                    buffer: signedBuffer,
                    fileName: `grant-letter-${grant.id}.pdf`,
                });
            }

            updatePayload = {
                ...updatePayload,
                signedAt: updatePayload.signedAt || new Date().toISOString(),
                signedFileId:
                    signedFile?.id || updatePayload.signedFileId || null,
                signedFileExternalId:
                    signedFileId || updatePayload.signedFileExternalId || null,
            };

            grant.set('signEasy', updatePayload);
            if (grant.status === 'approved') {
                await grant.transition('ACCEPT', {
                    comments: 'Signed via Signeasy webhook',
                    ...options,
                });
            } else {
                await grant.save({ hooks: false, ...options });
            }
        } else {
            grant.set('signEasy', updatePayload);
            await grant.save({ hooks: false, ...options });
        }

        return res.sendSuccess({ received: true });
    } catch (error) {
        logger.error('Signeasy webhook handling failed', error);
        return res.sendError(
            error.message || 'Webhook handling failed',
            'Error',
            500
        );
    }
};
