import express from 'express';
import { getVersions } from '../controllers/version.controller.js';
import { decodeQueryParams } from '../middlewares/request.middleware.js';
const router = express.Router();

// Versions
router.get('/', decodeQueryParams, getVersions);

export default router;
