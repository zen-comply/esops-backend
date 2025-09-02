import express from 'express';
import {
    getGrants,
    createGrant,
    updateGrant,
    getGrantById,
    getMyGrants,
} from '../controllers/grant.controller.js';

const router = express.Router();

/**
 * @route   GET /grants
 * @desc    Get all grants
 */
router.get('/', getGrants);

/**
 * @route   POST /grants
 * @desc    Create a new grant
 */
router.post('/', createGrant);

/**
 * @route   PUT /grants/:id
 * @desc    Update a grant
 */
router.put('/:id', updateGrant);

/**
 * @route   GET /grants/:id
 * @desc    Get grant by ID
 */
router.get('/:id', getGrantById);

/**
 * @route   GET /grants/my
 * @desc    Get grants for current user
 */
router.get('/my', getMyGrants);

export default router;
