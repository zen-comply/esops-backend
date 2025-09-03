import express from 'express';
import EmailService from '../services/email.service.js';

const router = express.Router();

router.post('/create-default', async (req, res) => {
    await new EmailService(req).createDefaultTemplates();
    return res.sendSuccess({ message: 'Default templates created' });
});
export default router;
