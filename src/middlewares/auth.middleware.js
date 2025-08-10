import jwt from 'jsonwebtoken';
import logger from '../logger.js';
import AuthService from '../services/auth.service.js';

export const verifyToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.sendError([], 'Unauthorized', 401);
    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        // get user
        let user = await new AuthService({
            options: {
                tenant_safe: true,
            },
        }).getUserByKey('email', decoded.email);

        req.user = user;

        // get user policies
        const policies = await user.getPolicies();
        req.policies = policies;

        // Set tenant Id
        req.options = {
            tenant_id: user.OrganisationId,
            UserId: user.id,
        };

        next();
    } catch (err) {
        logger.error('Error: ', err);
        return res.sendError([], 'Forbidden', 403);
    }
};
