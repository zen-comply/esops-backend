import express from 'express';
import dotenv from 'dotenv';
import { logRequest, responseFormatter } from './utils/rest.utils.js';
import swaggerUI from 'swagger-ui-express';
import { readFileSync } from 'fs';
import logger from './logger.js';
import cors from 'cors';
dotenv.config(); // Load environment variables from .env

// Routes
import { verifyToken } from './middlewares/auth.middleware.js';
import authRoutes from './routes/auth.route.js';
import orgRoutes from './routes/org.route.js';
import roleRoutes from './routes/role.route.js';
import userRoutes from './routes/user.route.js';
import fsmRoutes from './routes/fsm.route.js';
import versionRoutes from './routes/version.route.js';
import { getMe } from './controllers/user.controller.js';

const app = express();

// Allowed origins
const allowedOrigins = process.env.APP_ORIGINS
    ? process.env.APP_ORIGINS.split(',').map((origin) => origin.trim())
    : [process.env.APP_URL];

app.use(
    cors({
        origin: allowedOrigins,
        credentials: true,
    })
);

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

app.use('/auth', authRoutes);

app.use(verifyToken);

// Get current user
app.get('/me', getMe);

app.use('/organisations', orgRoutes);
app.use('/roles', roleRoutes);
app.use('/users', userRoutes);
app.use('/objects', fsmRoutes);
app.use('/versions', versionRoutes);

export default app; // Export for testing
