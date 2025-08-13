import express from 'express';
import {
    getActions,
    transition,
    createMachine,
    getMachines,
} from '../controllers/fsm.controller.js';
import upload from '../middlewares/multer.middleware.js';

const router = express.Router();

/**
 * @route   GET /fsm/:type/:id/actions
 * @desc    Get available FSM actions for a model instance
 */
router.get('/:type/:id/actions', getActions);

/**
 * @route   POST /fsm/:type/:id/transition
 * @desc    Perform a transition on a model instance
 * @body    { action: string, data?: object }
 */
router.post('/:type/:id/transition', upload.single('file'), transition);

/**
 * @route   POST /fsm/machines
 * @desc    Create a new state machine
 */
router.post('/machines', createMachine);

/**
 * @route   GET /fsm/machines
 * @desc    Get state machines
 */
router.get('/machines', getMachines);

export default router;
