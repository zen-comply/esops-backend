import logger from '../logger.js';
import FsmService from '../services/fsm.service.js';

export const getActions = async (req, res) => {
    /**
     * #swagger.tags = ['FSM APIs']
     * #swagger.description = 'API to get all actions for a model'
     */
    const { type, id } = req.params;

    try {
        const actions = await new FsmService(req).getActions(type, id);
        return res.sendSuccess(actions);
    } catch (error) {
        logger.error(error);
        return res.sendError([error.message], 'Error', 400);
    }
};

export const transition = async (req, res) => {
    /**
     * #swagger.tags = ['FSM APIs']
     * #swagger.description = 'API to perform a transition on a model'
     */
    const { type, id } = req.params;
    const { action, ...data } = req.body;
    const fsmService = new FsmService(req);
    const file = req.file;

    try {
        await fsmService.startTransaction();

        const result = await fsmService.transition(
            type,
            id,
            action,
            data,
            file
        );

        await fsmService.commit();

        return res.sendSuccess(result);
    } catch (error) {
        await fsmService.rollback();
        logger.error(error);
        return res.sendError([error.message], 'Error', 400);
    }
};

export const createMachine = async (req, res) => {
    /**
     * #swagger.tags = ['FSM APIs']
     * #swagger.description = 'API to create a state machine'
     */
    try {
        const fsmService = new FsmService(req);
        const created = await fsmService.createMachine(req.body);
        return res.sendSuccess(created, 'State machine created successfully');
    } catch (error) {
        logger.error(error);
        return res.sendError([error.message], 'Error', 400);
    }
};

export const getMachines = async (req, res) => {
    /**
     * #swagger.tags = ['FSM APIs']
     * #swagger.description = 'API to get state machines'
     */
    try {
        const fsmService = new FsmService(req);
        const machines = await fsmService.getMachines({
            attributes: req.query.attributes,
            filters: req.query.filters,
            sortBy: req.query.sortBy,
            sortOrder: req.query.sortOrder,
            page: req.query.page ? parseInt(req.query.page, 10) : undefined,
            limit: req.query.limit ? parseInt(req.query.limit, 10) : undefined,
        });
        return res.sendSuccess(machines);
    } catch (error) {
        logger.error(error);
        return res.sendError([error.message], 'Error', 400);
    }
};
