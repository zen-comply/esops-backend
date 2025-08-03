import bcrypt from 'bcryptjs';
import logger from '../logger.js';
import SequelizeService from './sequelize.service.js';

class AuthService extends SequelizeService {
    constructor(params) {
        super(params);
    }

    async getAccount({ username, password }) {
        if (!username || !password) {
            throw new Error('Username and password are required');
        }

        try {
            const account = await this.req.db.models.Account.findOne({
                where: { username },
                ...this.options,
            });

            if (!account) {
                throw new Error('Account not found');
            }

            const isMatch = await bcrypt.compare(password, account.password);
            if (!isMatch) {
                throw new Error('Invalid password');
            }

            return account;
        } catch (error) {
            logger.error('Error fetching account:', error);
            throw error;
        }
    }

    async createAccount({ username, password }) {
        if (!username || !password) {
            throw new Error('Username and password are required');
        }

        try {
            // The password will be hashed by the model's beforeCreate hook
            const account = await this.req.db.models.Account.create(
                { username, password },
                this.options
            );
            return account;
        } catch (error) {
            logger.error('Error creating account:', error);
            throw error;
        }
    }
}

export default AuthService;
