import logger from '../logger.js';
import UserService from '../services/user.service.js';

export const createUser = async (req, res) => {
    /**
     * #swagger.tags = ['Manage Users']
     * #swagger.description = 'API to create a new user'
     * #swagger.parameters['body'] = {
     *      in: 'body',
     *      required: true,
     *      schema: {
     *          firstName: { type: 'string', required: true },
     *          lastName: { type: 'string', required: true },
     *          email: { type: 'string', required: true },
     *          password: { type: 'string', required: true },
     *          roles: { type: 'array', items: { type: 'integer' }, required: true },
     *          notify: { type: 'boolean', required: false }
     *      }
     * }
     * #swagger.responses[200] = {
     *      description: 'User created successfully',
     *      schema: { $ref: '#/definitions/User' }
     * }
     * #swagger.responses[400] = {
     *      description: 'Validation error',
     *      schema: {
     *          message: 'Error',
     *          errors: [{ type: 'string' }]
     *      }
     * }
     */

    const userService = new UserService(req);
    try {
        // Create user
        await userService.startTransaction();

        const userData = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            password: req.body.password,
            OrganisationId: req.options.tenant_id,
        };
        const user = await userService.createUser(
            userData,
            req.body.roles,
            req.body.notify
        );

        await userService.commit();
        res.sendSuccess(user);
    } catch (e) {
        logger.error(e);
        await userService.rollback();
        res.sendError([e.message], 'Error', 400);
    }
};

export const getUsers = async (req, res) => {
    /**
     * #swagger.tags = ['Manage Users']
     * #swagger.description = 'API to get all users'
     * #swagger.parameters['page'] = { description: 'Page number', required: false, type: 'integer' }
     * #swagger.parameters['limit'] = { description: 'Number of items per page', required: false, type: 'integer' }
     * #swagger.responses[200] = {
     *      description: 'List of users',
     *      schema: { $ref: '#/definitions/UsersResponse' }
     * }
     * #swagger.responses[400] = {
     *      description: 'Validation error',
     *      schema: {
     *          message: 'Error',
     *          errors: [{ type: 'string' }]
     *      }
     * }
     */
    try {
        let page = req.query.page ? parseInt(req.query.page, 10) : 1;
        let limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
        const userService = new UserService(req);
        const users = await userService.getUsers(page, limit);
        res.sendSuccess(users);
    } catch (e) {
        logger.error(e);
        res.sendError([e.message], 'Error', 400);
    }
};

export const updateUser = async (req, res) => {
    /**
     * #swagger.tags = ['Manage Users']
     * #swagger.description = 'API to update a user'
     * #swagger.parameters['body'] = {
     *      in: 'body',
     *      required: true,
     *      schema: {
     *          firstName: { type: 'string', required: false },
     *          lastName: { type: 'string', required: false },
     *          email: { type: 'string', required: false },
     *          password: { type: 'string', required: false },
     *          roles: { type: 'array', items: { type: 'integer' }, required: false },
     *          notify: { type: 'boolean', required: false }
     *      }
     * }
     * #swagger.responses[200] = {
     *      description: 'User updated successfully',
     *      schema: { $ref: '#/definitions/UpdateUserResponse' }
     * }
     * #swagger.responses[400] = {
     *      description: 'Validation error',
     *      schema: {
     *          message: 'Error',
     *          errors: [{ type: 'string' }]
     *      }
     * }
     */
    try {
        const userService = new UserService(req);
        const user = await userService.updateUser(req.params.id, req.body);
        res.sendSuccess(user);
    } catch (e) {
        logger.error(e);
        res.sendError([e.message], 'Error', 400);
    }
};

export const deleteUser = async (req, res) => {
    /**
     * #swagger.tags = ['Manage Users']
     * #swagger.description = 'API to delete a user'
     */
    try {
        if (req.user.id == req.params.id) {
            throw new Error('You cannot delete yourself');
        }
        const userService = new UserService(req);
        await userService.deleteUser(req.params.id);
        res.sendSuccess('User deleted successfully');
    } catch (e) {
        logger.error(e);
        res.sendError([e.message], 'Error', 400);
    }
};

export const getMe = async (req, res) => {
    /**
     * #swagger.tags = ['Manage Users']
     * #swagger.description = 'API to get current user'
     */
    try {
        if (!req.user.OrganisationId) {
            req.options.tenant_safe = true;
        }
        const userService = new UserService(req);
        const user = await userService.getUserById(req.user.id);

        res.sendSuccess({
            user,
            policies: req.policies,
        });
    } catch (e) {
        logger.error(e);
        res.sendError([e.message], 'Error', 400);
    }
};
