import bcrypt from 'bcryptjs';
import logger from '../logger.js';
import SequelizeService from './sequelize.service.js';

class AuthService extends SequelizeService {
    constructor(params) {
        super(params);
    }

    async getUserByKey(key, value) {
        const user = await this.req.db.models.User.findOne({
            where: { [key]: value },
            include: {
                model: this.req.db.models.Organisation,
                attributes: ['id', 'name', 'context'],
            },
            ...this.options, // Options from parent class
        });
        return user;
    }

    async getUser({ email, password }) {
        if (!email || !password) {
            throw new Error('Email and password are required');
        }

        try {
            const user = await this.req.db.models.User.findOne({
                where: { email },
                attributes: [
                    'id',
                    'email',
                    'password',
                    'firstName',
                    'lastName',
                    'status',
                ],
                tenant_safe: true,
                ...this.options,
            });

            if (!user) {
                throw new Error('User not found');
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                throw new Error('Invalid password');
            }

            return user;
        } catch (error) {
            logger.error('Error fetching user:', error);
            throw error;
        }
    }

    async createUser({ email, password, firstName, lastName }) {
        if (!email || !password) {
            throw new Error('Email and password are required');
        }

        try {
            // The password will be hashed by the model's beforeCreate hook
            const user = await this.req.db.models.User.create(
                { email, password, firstName, lastName },
                this.options
            );
            return user;
        } catch (error) {
            logger.error('Error creating user:', error);
            throw error;
        }
    }
}

export default AuthService;
