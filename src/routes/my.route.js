import express from 'express';
import { getMyGrants } from '../controllers/grant.controller.js';

const router = express.Router();

/**
 * @route   GET /grants/my
 * @desc    Get grants for current user
 */
router.get('/grants', getMyGrants);

export default router;
