import templates from '../../config/templates/emails/index.js';
import logger from '../../logger.js';
import EmailService from '../../services/email.service.js';
import UserService from '../../services/user.service.js';
import { generateToken } from '../../utils/auth.util.js';

export default {
    APPROVE: {
        postTransition: async ({ id, req, data }) => {
            // get user
            const user = await new UserService(req).getUserById(id);
            if (!user) {
                throw new Error('User not found');
            }

            // Send email notification
            if (data.notify) {
                // send email
                const emailService = new EmailService(req);
                const token = await generateToken({ email: user.email }, '30d');
                const emailData = {
                    name: user.firstName,
                    url: `${process.env.APP_URL}/reset-password?token=${token}`,
                };
                const status = await emailService.sendEmail(
                    { email_template: templates.EIQWelcomeEmail.TemplateName },
                    user.email,
                    emailData
                );
                logger.info('Email sent status: ', status);
            }

            return user;
        },
    },
};
