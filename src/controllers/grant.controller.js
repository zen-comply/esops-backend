import logger from '../logger.js';
import GrantService from '../services/grant.service.js';

export const getGrants = async (req, res) => {
    /**
     * #swagger.tags = ['Grants']
     * #swagger.description = 'Get all grants'
     * #swagger.responses[200] = {
        description: 'List of grants',
        schema: { $ref: '#/definitions/GrantsResponse' }
      }
     */
    try {
        const grantService = new GrantService(req);
        const grants = await grantService.getGrants();
        res.sendSuccess(grants);
    } catch (err) {
        logger.error(err);
        res.sendError([err.message], 'Error', 400);
    }
};

export const createGrant = async (req, res) => {
    /**
     * #swagger.tags = ['Grants']
     * #swagger.description = 'Create a new grant'
     * #swagger.parameters['body'] = {
        in: 'body',
        required: true,
        schema: { $ref: '#/definitions/Grant' }
      }
     * #swagger.responses[200] = {
        description: 'Grant created successfully',
        schema: { $ref: '#/definitions/GrantResponse' }
      }
     */
    try {
        const grantService = new GrantService(req);
        const grant = await grantService.createGrant(req.body);
        res.sendSuccess(grant, 'Grant created successfully');
    } catch (err) {
        logger.error(err);
        res.sendError([err.message], 'Error', 400);
    }
};

export const updateGrant = async (req, res) => {
    /**
     * #swagger.tags = ['Grants']
     * #swagger.description = 'Update a grant'
     * #swagger.parameters['body'] = {
        in: 'body',
        required: true,
        schema: { $ref: '#/definitions/Grant' }
      }
     * #swagger.responses[200] = {
        description: 'Grant updated successfully',
        schema: { $ref: '#/definitions/GrantResponse' }
      }
     */
    try {
        const grantService = new GrantService(req);
        const grant = await grantService.updateGrant(req.params.id, req.body);
        res.sendSuccess(grant, 'Grant updated successfully');
    } catch (err) {
        logger.error(err);
        res.sendError([err.message], 'Error', 400);
    }
};

export const getGrantById = async (req, res) => {
    /**
     * #swagger.tags = ['Grants']
     * #swagger.description = 'Get grant by ID'
     * #swagger.responses[200] = {
        description: 'Grant details',
        schema: { $ref: '#/definitions/GrantResponse' }
      }
     */
    try {
        const grantService = new GrantService(req);
        const grant = await grantService.getGrantById(req.params.id);
        res.sendSuccess(grant);
    } catch (err) {
        logger.error(err);
        res.sendError([err.message], 'Error', 400);
    }
};

export const getMyGrants = async (req, res) => {
    /**
     * #swagger.tags = ['Grants']
     * #swagger.description = 'Get grants for current user'
     * #swagger.responses[200] = {
        description: 'List of grants for current user',
        schema: { $ref: '#/definitions/GrantsResponse' }
      }
     */
    try {
        const grantService = new GrantService(req);
        const grants = await grantService.getMyGrants();
        res.sendSuccess(grants);
    } catch (err) {
        logger.error(err);
        res.sendError([err.message], 'Error', 400);
    }
};
