import logger from '../logger.js';

const DEFAULT_ORIGINALS_PATH = '/v3/original';
const DEFAULT_ENVELOPES_PATH = '/v3/rs/envelope';
const DEFAULT_SIGNING_URL_PATH_TEMPLATE = '/v3/rs/envelope/{id}/signing/url/';

class SigneasyService {
    constructor(req) {
        this.req = req;
        this.apiKey = process.env.SIGNEASY_API_KEY;
        this.baseUrl = process.env.SIGNEASY_API_BASE_URL;
        this.originalsPath =
            process.env.SIGNEASY_ORIGINALS_PATH || DEFAULT_ORIGINALS_PATH;
        this.envelopesPath =
            process.env.SIGNEASY_ENVELOPES_PATH || DEFAULT_ENVELOPES_PATH;
        this.signingUrlPathTemplate =
            process.env.SIGNEASY_SIGNING_URL_PATH_TEMPLATE ||
            DEFAULT_SIGNING_URL_PATH_TEMPLATE;
    }

    _getUrl(pathname) {
        if (!this.baseUrl) {
            throw new Error('SIGNEASY_API_BASE_URL is not configured');
        }
        return new URL(pathname, this.baseUrl).toString();
    }

    _getAuthHeaders() {
        if (!this.apiKey) {
            throw new Error('SIGNEASY_API_KEY is not configured');
        }
        return {
            Authorization: `Bearer ${this.apiKey}`,
        };
    }

    _normalizeResponse(payload) {
        const signers = payload?.signers || payload?.signer || [];
        const firstSigner =
            Array.isArray(signers) && signers.length > 0 ? signers[0] : signers;

        return {
            requestId:
                payload?.request_id ||
                payload?.requestId ||
                payload?.id ||
                null,
            documentId:
                payload?.document_id ||
                payload?.documentId ||
                payload?.document?.id ||
                null,
            signerId: firstSigner?.id || payload?.signer_id || null,
            signingUrl:
                payload?.embedded_signing_url ||
                payload?.signing_url ||
                payload?.url ||
                null,
            status: payload?.status || null,
            payload,
        };
    }

    async downloadFile(url) {
        if (!url) {
            throw new Error('Download requires a url');
        }

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                ...this._getAuthHeaders(),
                accept: 'application/pdf',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            logger.error(
                `Signeasy download failed: ${response.status} ${response.statusText} ${errorText}`
            );
            throw new Error('Failed to download file from Signeasy');
        }

        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    }

    async downloadSignedFileById(signedFileId) {
        if (!signedFileId) {
            throw new Error('Download requires a signed file id');
        }

        const path = `/v3/rs/signed/${signedFileId}/download`;
        const url = this._getUrl(path);
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                ...this._getAuthHeaders(),
                accept: 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            logger.error(
                `Signeasy signed download failed: ${response.status} ${response.statusText} ${errorText}`
            );
            throw new Error('Failed to download signed file from Signeasy');
        }

        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    }

    async uploadOriginalDocument({
        fileBuffer,
        fileName,
        payloadOverrides = {},
    }) {
        if (!fileBuffer || !fileName) {
            throw new Error(
                'Original upload requires a PDF buffer and fileName'
            );
        }

        const formData = new FormData();
        formData.append(
            'file',
            new Blob([fileBuffer], { type: 'application/pdf' }),
            fileName
        );
        const timestamp = Date.now();
        const hash = `${timestamp}-${Math.random().toString(36).substring(2, 10)}`;
        formData.append('name', `${fileName}-${hash}`);

        if (Object.keys(payloadOverrides).length > 0) {
            formData.append('data', JSON.stringify(payloadOverrides));
        }

        const url = this._getUrl(this.originalsPath);
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                ...this._getAuthHeaders(),
            },
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            logger.error(
                `Signeasy original upload failed: ${response.status} ${response.statusText} ${errorText}`
            );
            throw new Error('Failed to upload original document to Signeasy');
        }

        return await response.json();
    }

    async createEnvelope({ originalId, signer, payloadOverrides = {} }) {
        if (!originalId) {
            throw new Error('Envelope creation requires an originalId');
        }
        if (!signer?.email) {
            throw new Error('Envelope creation requires signer email');
        }

        const [firstNameFromName = '', lastNameFromName = ''] = signer?.name
            ? signer.name.split(' ')
            : [];
        const firstName = signer.firstName || firstNameFromName || '';
        const lastName =
            signer.lastName ||
            (signer.name ? signer.name.split(' ').slice(1).join(' ') : '') ||
            lastNameFromName ||
            '';

        const payload = {
            embedded_signing: true,
            sources: [
                {
                    id: originalId,
                    type: 'original',
                    source_id: originalId,
                },
            ],
            recipients: [
                {
                    recipient_id: 1,
                    first_name: firstName,
                    last_name: lastName,
                    email: signer.email,
                },
            ],
            fields_payload: [
                {
                    source_id: originalId,
                    type: 'signature',
                    required: true,
                    recipient_id: 1,
                    page_number: 'all',
                    position: {
                        mode: 'referenceText',
                        text: '[[SIGNATURE_1]]',
                        height: 40,
                        width: 80,
                    },
                },
            ],
            ...payloadOverrides,
        };

        const url = this._getUrl(this.envelopesPath);
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                ...this._getAuthHeaders(),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            logger.error(
                `Signeasy envelope creation failed: ${response.status} ${response.statusText} ${errorText}`
            );
            throw new Error('Failed to create Signeasy envelope');
        }

        return await response.json();
    }

    async fetchSigningUrl(envelopeId, signerEmail) {
        if (!envelopeId) {
            throw new Error('Signing URL fetch requires an envelopeId');
        }
        if (!signerEmail) {
            throw new Error('Signing URL fetch requires signer email');
        }

        const path = this.signingUrlPathTemplate.replace('{id}', envelopeId);
        const url = this._getUrl(path);
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                ...this._getAuthHeaders(),
                accept: 'application/json',
                'content-type': 'application/json',
            },
            body: JSON.stringify({ recipient_email: signerEmail }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            logger.error(
                `Signeasy signing URL fetch failed: ${response.status} ${response.statusText} ${errorText}`
            );
            throw new Error('Failed to fetch Signeasy signing URL');
        }

        return await response.json();
    }

    async createSignatureRequest({
        fileBuffer,
        fileName,
        signer,
        anchorText,
        redirectUrl,
        callbackUrl,
        originalPayloadOverrides = {},
        envelopePayloadOverrides = {},
    }) {
        const originalResponse = await this.uploadOriginalDocument({
            fileBuffer,
            fileName,
            payloadOverrides: originalPayloadOverrides,
        });

        const originalId =
            originalResponse?.original_id ||
            originalResponse?.id ||
            originalResponse?.original?.id ||
            null;

        if (!originalId) {
            throw new Error('Signeasy original upload did not return an id');
        }

        const envelopeResponse = await this.createEnvelope({
            originalId,
            signer,
            anchorText,
            redirectUrl,
            callbackUrl,
            payloadOverrides: envelopePayloadOverrides,
        });

        const envelopeId =
            envelopeResponse?.id || envelopeResponse?.envelope_id;
        const signingUrlResponse = envelopeId
            ? await this.fetchSigningUrl(envelopeId, signer?.email)
            : null;
        const normalized = this._normalizeResponse({
            ...envelopeResponse,
            signing_url:
                signingUrlResponse?.signing_url ||
                signingUrlResponse?.url ||
                null,
        });
        return {
            ...normalized,
            documentId: normalized.documentId || originalId,
            payload: {
                original: originalResponse,
                envelope: envelopeResponse,
                signingUrl: signingUrlResponse,
            },
        };
    }
}

export default SigneasyService;
