import templates from '../config/templates/emails/index.js';
import logger from '../logger.js';
import { generateToken } from '../utils/auth.util.js';
import EmailService from './email.service.js';
import TenantService from './tenant.service.js';

class UserService extends TenantService {
    constructor(req) {
        super(req);

        // define common functions that do not need permissions to be called
        this.internalFunctions.push('getRoles');
    }

    /**
     * Get user by id
     * @param {*} userId
     * @returns
     */
    async getUserById(userId) {
        return await this.req.db.models.User.findByPk(userId, {
            include: [{ model: this.req.db.models.Organisation }],
            ...this.options,
        });
    }

    /**
     * Get all users for the current tenant
     * @returns
     */
    async getUsers(page, limit) {
        const offset = (page - 1) * limit;
        const usersCount = await this.req.db.models.User.findAll(this.options);
        const users = await this.req.db.models.User.findAll({
            limit,
            offset,
            include: [
                {
                    model: this.req.db.models.Role,
                    through: { attributes: [] },
                },
            ],
            ...this.options,
        });

        return {
            total: usersCount.length,
            page,
            limit,
            data: users,
        };
    }

    async createUser(data, roles = null, notify = false) {
        const userData = {
            firstName: data.firstName || null,
            lastName: data.lastName || null,
            email: data.email || null,
            password: data.password || null,
            OrganisationId: data.OrganisationId || this.tenantId,
        };

        let user = await this.req.db.models.User.create(userData, this.options);

        if (roles) {
            await user.setRoles(roles, this.req.options);
        } else {
            throw new Error('Roles are required to create a user');
        }

        if (notify) {
            // send email
            const emailService = new EmailService(this.req);
            const token = await generateToken({ email: user.email }, '30d');
            const emailData = {
                name: user.firstName,
                url: `${process.env.APP_URL}/reset-password?token=${token}`,
            };
            const status = await emailService.sendEmail(
                { email_template: templates.WelcomeEmail.TemplateName },
                user.email,
                emailData
            );
            logger.info('Email sent status: ', status);
        }

        return user;
    }

    /**
     * Get all roles
     * @returns
     */
    async getRoles() {
        let where = {
            $or: [{ OrganisationId: null }],
        };
        if (this.tenantId) {
            where.$or.push({ OrganisationId: this.tenantId });
        }
        return await this.req.db.models.Role.findAll(where, this.options);
    }

    /**
     * Update user for current tenant
     * @param {*} id
     * @param {*} data
     * @returns
     */
    async updateUser(id, data) {
        const user = await this.req.db.models.User.findByPk(id, this.options);
        if (!user) throw new Error('User not found');

        const updatedData = {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
        };
        return await user.update(updatedData, this.options);
    }

    /**
     * delete a user for current tenant
     * @param {*} id
     * @returns
     */
    async deleteUser(id) {
        const user = await this.req.db.models.User.findByPk(id, this.options);
        if (!user) throw new Error('User not found');

        return await user.destroy(this.options);
    }

    /**
     * Get users by roles
     * @param {*} roleId
     * @returns
     */
    async getUsersByRoles(roleId = []) {
        const users = await this.req.db.models.User.findAll({
            include: [
                {
                    model: this.req.db.models.Role,
                    through: { attributes: [] },
                    where: { id: roleId },
                },
            ],
            ...this.options,
        });

        return {
            total: users.length,
            data: users,
        };
    }
}

export default UserService;
