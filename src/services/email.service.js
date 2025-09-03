import {
    SESv2Client,
    CreateEmailTemplateCommand,
    DeleteEmailTemplateCommand,
    SendEmailCommand,
    ListEmailTemplatesCommand,
} from '@aws-sdk/client-sesv2';

import Handlebars from 'handlebars';
import path from 'path';
import { readFileSync } from 'fs';

import { SESClient, SendRawEmailCommand } from '@aws-sdk/client-ses';
import logger from '../logger.js';
import SecureService from './secure.service.js';
import templates from '../config/templates/emails/index.js';

class EmailService extends SecureService {
    constructor(req) {
        super(req);

        this.client = new SESv2Client({
            region: process.env.AWS_DEFAULT_REGION,
        });

        this.sesClient = new SESClient({
            region: process.env.AWS_DEFAULT_REGION,
        });
        this.data = {
            toolName: 'EquityIQ',
            toolContactInfo: 'support@equityiq.co',
            toolUrl: process.env.APP_URL,
        };

        this.internalFunctions.push('createDefaultTemplates');
    }

    /**
     * Create an html based template on AWS SES
     * @param {*} name | name of the template
     * @param {*} subject | subject of the email. This can include variables e.g. 'Welcome to our site : {{name}}'
     * @param {*} html | html based body of the email. This can include variables e.g. 'Hi {{name}}, Please find the details'
     * @returns
     */
    async createTemplate(name, subject, html) {
        let response = {
            status: false,
            message: '',
            data: null,
        };
        const input = {
            TemplateName: name,
            TemplateContent: {
                // EmailTemplateContent
                Subject: subject,
                Html: html,
            },
        };
        try {
            const command = new CreateEmailTemplateCommand(input);
            const clientResponse = await this.client.send(command);
            response.status = true;
            response.data = clientResponse;
        } catch (error) {
            logger.error(error);
            response.message = error.message;
        }
        return response;
    }

    /**
     * Delete a temlpate from AWS SES by name
     * @param {*} name | name of the template to be deleted
     * @returns
     */
    async deleteTemplate(name) {
        let response = {
            status: false,
            message: '',
            data: null,
        };
        const input = {
            TemplateName: name,
        };
        try {
            const command = new DeleteEmailTemplateCommand(input);
            const clientResponse = await this.client.send(command);
            response.status = true;
            response.data = clientResponse;
        } catch (error) {
            logger.error(error);
            response.message = error.message;
        }
        return response;
    }

    /**
     * Get all the templates from AWS SES
     * @returns
     */
    async getTemplates() {
        let response = {
            status: false,
            message: '',
            data: null,
        };
        const input = {};
        try {
            const command = new ListEmailTemplatesCommand(input);
            const clientResponse = await this.client.send(command);
            response.status = true;
            response.data = clientResponse;
        } catch (error) {
            logger.error(error);
            response.message = error.message;
        }
        return response;
    }

    /**
     * Send email using SES template
     * @param {*} type | Name of the template to be used
     * @param {*} to | email address of the recipient
     * @param {*} data | data to be used in the template (JSON format)
     * @returns
     */
    async sendEmail(type, to, data, attachments = [], cc = [], bcc = []) {
        const templateName = type.email_template;
        let response = {
            status: false,
            message: '',
            data: null,
        };
        const templateData = { ...this.data, ...data };
        try {
            if (attachments.length === 0) {
                // Use standard SESv2 templated email
                const input = {
                    FromEmailAddress: 'no-reply@zencomply.co',
                    Destination: {
                        ToAddresses: [to],
                        CcAddresses: cc,
                        BccAddresses: bcc,
                    },
                    Content: {
                        Template: {
                            TemplateName: templateName,
                            TemplateData: JSON.stringify(templateData),
                        },
                    },
                };

                const command = new SendEmailCommand(input);
                const clientResponse = await this.client.send(command);
                response.status = true;
                response.data = clientResponse;
            } else {
                // Fallback: use raw email with rendered template content and attachments
                if (!type.fileName) {
                    throw new Error('Filename is required');
                }

                const templateConfig = templates[templateName];
                const templatePath = path.resolve(
                    'src/config/templates/emails/htmls',
                    type.fileName
                );
                const html = readFileSync(templatePath, 'utf-8');
                const compiledHtml = Handlebars.compile(html)(templateData);
                const htmlBase64 = Buffer.from(compiledHtml).toString('base64');

                // Construct raw MIME message
                const boundary = `NextPart-${Date.now()}`;
                let rawMessage = '';

                rawMessage += `From: no-reply@zencomply.co\n`;
                rawMessage += `To: ${to}\n`;
                if (cc?.length) rawMessage += `Cc: ${cc.join(', ')}\n`;
                if (bcc?.length) rawMessage += `Bcc: ${bcc.join(', ')}\n`;
                rawMessage += `Subject: ${templateConfig.SubjectPart}\n`;
                rawMessage += `MIME-Version: 1.0\n`;
                rawMessage += `Content-Type: multipart/mixed; boundary="${boundary}"\n\n`;

                // Email body (HTML)
                rawMessage += `--${boundary}\n`;
                rawMessage += `Content-Type: text/html; charset="utf-8"\n`;
                rawMessage += `Content-Transfer-Encoding: base64\n\n`;
                rawMessage += `${htmlBase64}\n\n`;

                // Attachments
                for (const attachment of attachments) {
                    rawMessage += `--${boundary}\n`;
                    rawMessage += `Content-Type: ${attachment.ContentType}; name="${attachment.FileName}"\n`;
                    rawMessage += `Content-Disposition: attachment; filename="${attachment.FileName}"\n`;
                    rawMessage += `Content-Transfer-Encoding: base64\n\n`;
                    rawMessage += `${attachment.RawContent}\n\n`;
                }

                rawMessage += `--${boundary}--`;

                const sendRawEmailCommand = new SendRawEmailCommand({
                    RawMessage: {
                        Data: Buffer.from(rawMessage),
                    },
                });

                const clientResponse =
                    await this.sesClient.send(sendRawEmailCommand);

                logger.info(`Email (raw) sent to ${to}`, {
                    action: 'email.success',
                    template: templateName,
                    recipient: to,
                    cc,
                    bcc,
                    data: templateData,
                });

                response.status = true;
                response.data = clientResponse;
            }

            logger.info(`Email sent to ${to}`, {
                action: 'email.success',
                template: templateName,
                recipient: to,
                cc: cc,
                bcc: bcc,
                data: templateData,
            });
        } catch (e) {
            logger.error(e);
            response.message = e.message;
            throw e;
        }

        return response;
    }

    async createDefaultTemplates() {
        for (const key in templates) {
            const template = templates[key];
            try {
                await this.createTemplate(
                    template.TemplateName,
                    template.SubjectPart,
                    template.HtmlPart
                );
            } catch (e) {
                logger.error(e);
            }
        }
        return true;
    }
}

export default EmailService;
