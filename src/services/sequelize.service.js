import db from '../config/database.js';
import logger from '../logger.js';

/**
 * This service is responsible for any sequelize operations ensuring that same database
 * options are being used across all services for a given 'req' object
 */
class SequelizeService {
    constructor(req) {
        if (!req) throw new Error('Request object is required');
        this.req = req;

        this.options = req.options || {};

        // db object is shared across all services
        this.req.db = db;

        // defined common functions
        this.internalFunctions = [];
    }

    async startTransaction() {
        try {
            this.options.transaction =
                await this.req.db.sequelize.transaction();
        } catch (e) {
            logger.error(e);
        } finally {
            this.updateRequestOptions();
        }
    }

    async commit() {
        this.options.transaction && (await this.options.transaction.commit());
        this.options.transaction = null;
        this.updateRequestOptions();
        return;
    }

    async rollback() {
        this.options.transaction && (await this.options.transaction.rollback());
        this.options.transaction = null;
        this.updateRequestOptions();
        return;
    }

    async updateRequestOptions() {
        this.req.options = this.options;
    }
}

export default SequelizeService;
