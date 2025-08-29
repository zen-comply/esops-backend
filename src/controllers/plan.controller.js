import logger from '../logger.js';
import PlanService from '../services/plan.service.js';

export const getPlans = async (req, res) => {
    /**
     * #swagger.tags = ['Plans']
     * #swagger.description = 'Get all plans'
     */
    try {
        const planService = new PlanService(req);
        const plans = await planService.getPlans();
        res.sendSuccess(plans);
    } catch (err) {
        logger.error(err);
        res.sendError([err.message], 'Error', 400);
    }
};

export const createPlan = async (req, res) => {
    /**
     * #swagger.tags = ['Plans']
     * #swagger.description = 'Create a new plan'
     */
    try {
        const planService = new PlanService(req);
        const plan = await planService.createPlan(req.body);
        res.sendSuccess(plan, 'Plan created successfully');
    } catch (err) {
        logger.error(err);
        res.sendError([err.message], 'Error', 400);
    }
};

export const updatePlan = async (req, res) => {
    /**
     * #swagger.tags = ['Plans']
     * #swagger.description = 'Update a plan'
     */
    try {
        const planService = new PlanService(req);
        const plan = await planService.updatePlan(req.params.id, req.body);
        res.sendSuccess(plan, 'Plan updated successfully');
    } catch (err) {
        logger.error(err);
        res.sendError([err.message], 'Error', 400);
    }
};

export const deletePlan = async (req, res) => {
    /**
     * #swagger.tags = ['Plans']
     * #swagger.description = 'Delete a plan'
     */
    try {
        const planService = new PlanService(req);
        const result = await planService.deletePlan(req.params.id);
        res.sendSuccess(result);
    } catch (err) {
        logger.error(err);
        res.sendError([err.message], 'Error', 400);
    }
};
