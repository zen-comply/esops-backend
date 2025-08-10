import express from 'express';
import { getRoles } from '../controllers/role.controller.js';
const router = express.Router();

// Manage roles
router.get('/', getRoles);

export default router;
