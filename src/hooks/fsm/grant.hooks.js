import templates from '../../config/templates/emails/index.js';
import logger from '../../logger.js';
import EmailService from '../../services/email.service.js';
import GrantService from '../../services/grant.service.js';

export default {
    APPROVE: {
        postTransition: async ({ id, req }) => {
            // get grant
            const grant = await new GrantService(req).getGrantById(id);
            if (!grant) {
                throw new Error('Grant not found');
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
                { email_template: templates.NewGrant.TemplateName },
                grant.User.email,
                emailData
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
};
