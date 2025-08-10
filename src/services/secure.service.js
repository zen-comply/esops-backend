import SequelizeService from './sequelize.service.js';

/**
 * This service is responsible for any secure operations ensuring that the user has the required permissions
 */
class SecureService extends SequelizeService {
    constructor(req) {
        super(req);

        if (!req?.policies) {
            throw new Error('Request object with policies is required');
        }

        // Return a proxy to intercept method calls
        return new Proxy(this, {
            get: (target, prop) => {
                if (
                    typeof target[prop] === 'function' &&
                    prop !== 'constructor' &&
                    !this.internalFunctions.includes(prop) &&
                    !prop.startsWith('_') // Skip permission check for internal functions
                ) {
                    return (...args) => {
                        // Automatically check permissions before calling the method
                        this.checkPermission(
                            `${target.constructor.name}:${prop}`
                        );
                        return target[prop](...args);
                    };
                }
                return target[prop];
            },
        });
    }

    /**
     * Check if the user has permission for the given action.
     * @param {string} action - The name of the action (e.g., 'OrgService:createUser').
     */
    checkPermission(action) {
        const { policies } = this.req;
        const appliedPolicies = [];
        for (const policy of policies) {
            for (const pol of policy.policy) {
                if (pol?.action?.includes(action)) {
                    appliedPolicies.push(policy.policy);
                }
            }
        }
        if (appliedPolicies.length == 0) {
            throw new Error(`Access denied: Missing permission for ${action}`);
        }
    }
}

export default SecureService;
