import express from 'express';
import {
    getPlans,
    createPlan,
    updatePlan,
    deletePlan,
} from '../controllers/plan.controller.js';

const router = express.Router();

/**
 * @route   GET /plans
 * @desc    Get all plans
 */
router.get('/', getPlans);

/**
 * @route   POST /plans
 * @desc    Create a new plan
 */
router.post('/', createPlan);

/**
 * @route   PUT /plans/:id
 * @desc    Update a plan
 */
router.put('/:id', updatePlan);

/**
 * @route   DELETE /plans/:id
 * @desc    Delete a plan
 */
router.delete('/:id', deletePlan);

export default router;
