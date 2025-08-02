import express from 'express';
import dotenv from 'dotenv';
import { logRequest, responseFormatter } from './utils/rest.utils.js';
import swaggerUI from 'swagger-ui-express';
import { readFileSync } from 'fs';
import logger from './logger.js';
import sequelize from './config/database.js';
dotenv.config(); // Load environment variables from .env

const app = express();

// Database connection
sequelize
    .authenticate()
    .then(() => {
        logger.info('Connection has been established successfully.');
    })
    .catch((err) => {
        logger.error('Unable to connect to the database:', err);
    });

app.use(express.json());

// middleware to format responses
app.use(responseFormatter);

// middleware to log requests
app.use(logRequest);

// Swagger UI
try {
    const swaggerDocument = JSON.parse(
        readFileSync('./swagger/swagger-output.json')
    );
    app.use(
        '/api-docs',
        swaggerUI.serve,
        swaggerUI.setup(swaggerDocument, { explorer: true })
    );
} catch (e) {
    logger.error('Failed to load swagger docs', e);
}

// All routes
app.get('/', (req, res) => {
    res.json({ message: 'Hello, World!' });
});

export default app; // Export for testing
