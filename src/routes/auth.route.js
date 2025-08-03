import express from 'express';
import { login } from '../controllers/auth.controller.js';
const router = express.Router();

// Auth routes
router.post('/login', login);

export default router;
