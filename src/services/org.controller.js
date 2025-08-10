import logger from '../logger.js';
import OrganisationService from '../services/organisation.service.js';
import UserService from '../services/user.service.js';

const DEFAULT_PASSWORD = `${Math.random().toString(36).slice(-8)}+Pass123`;

export const getAllOrgs = async (req, res) => {
    /**
     * #swagger.tags = ['Manage Organisations']
     * #swagger.description = 'Get all organisations
     * #swagger.parameters['page'] = { description: 'Page number', required: false, type: 'integer' }
     * #swagger.parameters['limit'] = { description: 'Number of items per page', required: false, type: 'integer' }
     */
    try {
        let page = req.query.page ? parseInt(req.query.page, 10) : 1;
        let limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;

        const orgService = new OrganisationService(req);
        const orgs = await orgService.getOrganisations(page, limit);
        res.sendSuccess(orgs);
    } catch (err) {
        logger.error('Error: ', err);
        res.sendError(err, err.message, 400);
    }
};

export const createOrg = async (req, res) => {
    /**
     * #swagger.tags = ['Manage Organisations']
     * #swagger.description = 'Create an organisation'
     */
    const orgService = new OrganisationService(req);
    try {
        // Start transaction
        await orgService.startTransaction();

        // Create org
        const orgData = {
            name: req.body.name,
        };
        const org = await orgService.createOrganisation(orgData);

        // If the org is created, create admin user
        if (!org) throw new Error('Failed to create organisation');

        // Create admin user
        req.options = req.options || {};
        req.options.tenant_safe = true;
        const userData = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            password: req.body.password || DEFAULT_PASSWORD, // Default
            OrganisationId: org.id,
        };

        // get roles
        const userService = new UserService(req);
        const allRoles = await userService.getRoles();
        const adminRole = allRoles.find((role) => role.name === 'Admin');
        const roles = adminRole ? [adminRole] : [];
        const user = await userService.createUser(userData, roles, true);
        if (!user) throw new Error('Failed to create admin user');

        // Commit
        await orgService.commit();

        res.sendSuccess(org);
    } catch (err) {
        // Roll back
        await orgService.rollback();

        logger.error('Error: ', err);
        res.sendError(err, err.message, 400);
    }
};

export const updateOrg = async (req, res) => {
    /**
     * #swagger.tags = ['Manage Organisations']
     * #swagger.description = 'Update an organisation'
     */
    const orgService = new OrganisationService(req);
    try {
        // Start transaction
        await orgService.startTransaction();

        // Update org
        const orgData = {
            name: req.body.name,
            context: req.body.context || null,
        };
        const org = await orgService.updateOrganisation(req.params.id, orgData);

        // Commit
        await orgService.commit();

        res.sendSuccess(org);
    } catch (err) {
        // Roll back
        await orgService.rollback();

        logger.error('Error: ', err);
        res.sendError(err, err.message, 400);
    }
};

export const deleteOrg = async (req, res) => {
    /**
     * #swagger.tags = ['Manage Organisations']
     * #swagger.description = 'Delete an organisation'
     */
    const orgService = new OrganisationService(req);
    try {
        // Start transaction
        await orgService.startTransaction();

        // Delete org
        const org = await orgService.deleteOrganisation(req.params.id);

        // Commit
        await orgService.commit();

        res.sendSuccess(org);
    } catch (err) {
        // Roll back
        await orgService.rollback();

        logger.error('Error: ', err);
        res.sendError(err, err.message, 400);
    }
};
