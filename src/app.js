import express from 'express';
import dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: 'Hello, World!' });
});

export default app; // Export for testing
