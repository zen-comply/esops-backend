import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const {
    DB_USER,
    DB_PASSWORD,
    DB_HOST,
    DB_PORT,
    DB_NAME,
    DB_NAME_TEST,
    NODE_ENV,
} = process.env;

const isTest = NODE_ENV === 'test';

const sequelize = new Sequelize(
    isTest ? DB_NAME_TEST : DB_NAME,
    DB_USER,
    DB_PASSWORD,
    {
        host: DB_HOST,
        port: DB_PORT,
        dialect: 'mysql',
        logging: false,
    }
);

export default sequelize;
