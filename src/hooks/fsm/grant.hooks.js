import templates from '../../config/templates/emails/index.js';
import logger from '../../logger.js';
import EmailService from '../../services/email.service.js';
import GrantService from '../../services/grant.service.js';
import SigneasyService from '../../services/signeasy.service.js';
import {
    createFileObject,
    deleteFileFromS3,
    fillHtmlTemplate,
    getFileBufferFromS3,
    uploadFileToS3,
} from '../../utils/file.utils.js';
import { generatePdfFromHtml } from '../../utils/pdf.utils.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Op } from 'sequelize';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const grantTemplatePath = path.resolve(
    __dirname,
    '../../templates/grant-letter.html'
);

const getGrantLetterFiles = async (req, grantId) => {
    return await req.db.models.File.findAll({
        ...req.options,
        where: {
            fileFor: 'grant',
            fileForId: grantId,
            name: {
                [Op.like]: 'grant-letter-%',
            },
        },
    });
};

const getReceiverName = (grant) => {
    const firstName = grant?.User?.firstName || '';
    const lastName = grant?.User?.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || grant?.User?.email || 'Recipient';
};

const generateGrantLetter = async ({ req, grant, removeExisting = false }) => {
    const existingFiles = await getGrantLetterFiles(req, grant.id);

    if (removeExisting && existingFiles.length > 0) {
        for (const existingFile of existingFiles) {
            if (existingFile?.s3Bucket && existingFile?.s3Key) {
                await deleteFileFromS3(
                    existingFile.s3Bucket,
                    existingFile.s3Key
                );
            }
            await existingFile.destroy(req.options);
        }
    }

    if (!removeExisting && existingFiles.length > 0) {
        return existingFiles[0];
    }

    const grantData =
        typeof grant.toJSON === 'function' ? grant.toJSON() : grant;
    const receiverName =
        `${grantData?.User?.firstName || ''} ${grantData?.User?.lastName || ''}`.trim();
    const templateData = {
        ...grantData,
        receiverName: receiverName || grantData?.User?.email || 'Recipient',
        planName: grantData?.Plan?.name || '',
        cliffMonths: grantData?.Schedule?.cliff ?? 0,
        Vests: grantData?.Vests || [],
    };

    const template = fs.readFileSync(grantTemplatePath, 'utf-8');
    const html = fillHtmlTemplate(template, templateData);
    const pdfBuffer = await generatePdfFromHtml(html);

    const fileName = `grant-letter-${grant.id}.pdf`;
    const fileObject = createFileObject(
        pdfBuffer,
        fileName,
        'application/pdf',
        pdfBuffer.length
    );

    fileObject.s3Key = `organisations/${grant.OrganisationId}/grants/${grant.id}/${fileName}`;
    fileObject.s3Bucket = process.env.S3_BUCKET_NAME;

    const s3Response = await uploadFileToS3(
        fileObject,
        fileObject.s3Bucket,
        fileObject.s3Key,
        process.env.MAX_FILE_SIZE,
        ['pdf']
    );

    if (!s3Response) {
        const errorMessage = `Failed to upload grant letter to S3. Bucket: ${fileObject.s3Bucket}, Key: ${fileObject.s3Key}`;
        logger.error(errorMessage);
        throw new Error(errorMessage);
    }

    const grantLetterFile = await req.db.models.File.create(
        {
            name: fileName,
            s3Key: fileObject.s3Key,
            s3Bucket: fileObject.s3Bucket,
            fileFor: 'grant',
            fileForId: grant.id,
            size: pdfBuffer.length,
            mimeType: 'application/pdf',
        },
        req.options
    );

    const signeasyService = new SigneasyService(req);
    const signEasy = await signeasyService.createSignatureRequest({
        fileBuffer: pdfBuffer,
        fileName,
        signer: {
            name: getReceiverName(grant),
            email: grant.User.email,
        },
        anchorText: process.env.SIGNEASY_ANCHOR_TEXT || '[[SIGNATURE_1]]',
        redirectUrl: process.env.SIGNEASY_REDIRECT_URL,
        callbackUrl: process.env.SIGNEASY_CALLBACK_URL,
    });

    const existingSignEasy =
        grant.signEasy && typeof grant.signEasy === 'object'
            ? grant.signEasy
            : {};
    await grant.update(
        {
            signEasy: {
                ...existingSignEasy,
                ...signEasy,
            },
        },
        req.options
    );

    return grantLetterFile;
};

export default {
    getActions: async ({ instance, actions }) => {
        const signingUrl = instance?.signEasy?.signingUrl || null;
        if (!signingUrl) return actions;

        return actions.map((action) => {
            if (action.eventType === 'ACCEPT') {
                return {
                    ...action,
                    url: signingUrl,
                };
            }
            return action;
        });
    },
    APPROVE: {
        postTransition: async ({ id, req }) => {
            // get grant
            const grant = await new GrantService(req).getGrantById(id);
            if (!grant) {
                throw new Error('Grant not found');
            }

            const grantLetterFile = await generateGrantLetter({
                req,
                grant,
                removeExisting: false,
            });

            let attachments = [];
            let fileBuffer = null;
            if (grantLetterFile?.s3Bucket && grantLetterFile?.s3Key) {
                fileBuffer = await getFileBufferFromS3(
                    grantLetterFile.s3Bucket,
                    grantLetterFile.s3Key
                );
                attachments = [
                    {
                        FileName: grantLetterFile.name,
                        ContentType:
                            grantLetterFile.mimeType || 'application/pdf',
                        RawContent: fileBuffer.toString('base64'),
                    },
                ];
            }

            // send email
            const emailService = new EmailService(req);
            let emailData = {
                name: grant.User.firstName,
                grantDate: grant.grantDate,
                granted: grant.granted,
                strikePrice: grant.strikePrice,
            };
            const status = await emailService.sendEmail(
                {
                    email_template: templates.EIQNewGrant.TemplateName,
                    fileName: 'new-grant.html',
                },
                grant.User.email,
                emailData,
                attachments
            );
            logger.info('Email sent status: ', status);

            return grant;
        },
    },
    REJECT: {
        postTransition: async ({ id, req, data }) => {
            req.options.comments = data.comments;
            const grantService = new GrantService(req);

            await grantService.rejectGrant(id);

            return { message: 'Grant rejected' };
        },
    },
    GENERATE_LETTER: {
        postTransition: async ({ id, req }) => {
            const grantService = new GrantService(req);
            const grant = await grantService.getGrantById(id);
            if (!grant) {
                throw new Error('Grant not found');
            }

            await generateGrantLetter({
                req,
                grant,
                removeExisting: true,
            });

            return await grantService.getGrantById(id);
        },
    },
};
