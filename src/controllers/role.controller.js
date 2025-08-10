import logger from '../logger.js';
import RolesService from '../services/roles.service.js';

export const getRoles = async (req, res) => {
    /**
     * #swagger.tags = ['Roles']
     * #swagger.description = 'API to get all roles'
     */
    try {
        const rolesService = new RolesService(req);
        const roles = await rolesService.getRoles();
        res.sendSuccess(roles);
    } catch (e) {
        logger.error(e);
        res.sendError([e.message], 'Error', 400);
    }
};
