import express from 'express';
import dotenv from 'dotenv';
import { logRequest, responseFormatter } from './utils/rest.utils';
dotenv.config(); // Load environment variables from .env

const app = express();

app.use(express.json());

// middleware to format responses
app.use(responseFormatter);

// middleware to log requests
app.use(logRequest);

app.get('/', (req, res) => {
    res.json({ message: 'Hello, World!' });
});

export default app; // Export for testing
