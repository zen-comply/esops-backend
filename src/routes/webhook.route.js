import express from 'express';
import { handleSigneasyWebhook } from '../controllers/webhook.controller.js';

const router = express.Router();

router.post('/signeasy', handleSigneasyWebhook);

export default router;
