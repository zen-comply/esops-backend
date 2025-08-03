import AuthService from '../services/auth.service.js';
import { generateToken } from '../utils/auth.util.js';

export const login = async (req, res) => {
    /**
     * #swagger.tags = ['Auth']
     */

    const authService = new AuthService(req);

    try {
        const user = await authService.getUser({
            email: req.body.email,
            password: req.body.password,
        });

        // Prepare token
        const tokenObj = {
            email: user.email,
        };

        const accessToken = await generateToken(tokenObj, '1h');

        const refreshToken = await generateToken(tokenObj, '30d');

        res.cookie('jwt', refreshToken, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000,
        });

        res.sendSuccess({
            accessToken: accessToken,
        });
    } catch (e) {
        return res.sendError([e.message], 'Error', 401);
    }
};
