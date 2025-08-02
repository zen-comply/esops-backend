import db from '@ensoai/esop-models';
import logger from '../logger.js';

const config = {};

const init = async () => {
    try {
        await db.sequelize.authenticate();

        config.sequelize = db.sequelize;
        config.models = db.models;
    } catch (err) {
        logger.error('Error: ', err);
    }
};

await init();

export default config;
