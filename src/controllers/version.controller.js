import logger from '../logger.js';
import VersionService from '../services/version.service.js';

export const getVersions = async (req, res) => {
    /**
     * #swagger.tags = ['Manage Versions']
     * #swagger.description = 'API to get all versions'
     * #swagger.parameters['page'] = { description: 'Page number', required: false, type: 'integer' }
     * #swagger.parameters['limit'] = { description: 'Number of items per page', required: false, type: 'integer' }
     * #swagger.parameters['sortBy'] = { description: 'Sort by field', required: false, type: 'string' }
     * #swagger.parameters['sortOrder'] = { description: 'Sort order', required: false, type: 'string', enum: ['ASC', 'DESC'] }
     * #swagger.parameters['filters'] = { description: 'Filters to apply', required: false, type: 'object' }
     * #swagger.parameters['attributes'] = { description: 'Attributes to include', required: false, type: 'array' }
     */
    try {
        const { attributes, page, limit, filters, sortBy, sortOrder, groupBy } =
            req.query;
        const versionService = new VersionService(req);
        const versions = await versionService.getVersions({
            attributes,
            page,
            limit,
            filters,
            sortBy,
            sortOrder,
            groupBy,
        });
        res.sendSuccess(versions);
    } catch (e) {
        logger.error(e);
        res.sendError([e.message], 'Error', 400);
    }
};
