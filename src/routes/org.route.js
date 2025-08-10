import express from 'express';
import {
    createOrg,
    deleteOrg,
    getAllOrgs,
    updateOrg,
} from '../controllers/org.controller.js';
const router = express.Router();

// Manage orgs
router.get('/', getAllOrgs);
router.post('/', createOrg);
router.put('/:id', updateOrg);
router.delete('/:id', deleteOrg);

export default router;
