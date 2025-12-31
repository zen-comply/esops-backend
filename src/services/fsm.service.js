import logger from '../logger.js';
import { uploadFileToS3 } from '../utils/file.utils.js';
import TenantService from './tenant.service.js';

class FsmService extends TenantService {
    constructor(req) {
        super(req);
    }

    /*
     * Retrieves an instance of a model by its ID.
     * @param {string} modelName - The name of the model.
     * @param {string|number} id - The ID of the instance.
     * @returns {Promise<object|null>} The model instance or null if not found.
     */
    async _getModelInstance(modelName, id) {
        const Model = this.req.db.models[modelName];
        if (!Model) {
            logger.error(`FsmService: Model ${modelName} not found.`);
            throw new Error(`Model type '${modelName}' not supported.`);
        }
        const instance = await Model.findByPk(id, this.options);
        if (!instance) {
            logger.warn(
                `FsmService: Instance of ${modelName} with ID ${id} not found.`
            );
            return null;
        }
        return instance;
    }

    /**
     * Converts a type string (e.g., "invoice", "customer") to a Sequelize model name.
     * Assumes PascalCase for model names.
     * @param {string} type - The object type.
     * @returns {string} The model name.
     */
    _getModelName(type) {
        if (!type || typeof type !== 'string') {
            throw new Error('Invalid type provided for model name generation.');
        }
        return type.charAt(0).toUpperCase() + type.slice(1);
    }

    /*
     * Gets the available actions for a given object type and ID.
     * @param {string} type - The type of the object (e.g., "invoice").
     * @param {string|number} id - The ID of the object.
     * @returns {Promise<Array<string>>} A list of available actions.
     */
    async getActions(type, id) {
        const modelName = this._getModelName(type);
        const instance = await this._getModelInstance(modelName, id);

        if (!instance) {
            throw new Error(`${modelName} with ID ${id} not found.`);
        }

        if (typeof instance.getActions !== 'function') {
            logger.error(
                `FsmService: Model ${modelName} does not have a getActions method.`
            );
            throw new Error(`Actions cannot be retrieved for ${modelName}.`);
        }

        // Get all possible actions from the instance
        let actions = await instance.getActions(this.options);

        // Filter actions based on user policies (fsmActions)
        const allowedActions = [];
        if (Array.isArray(this.req.policies)) {
            for (const policy of this.req.policies) {
                if (Array.isArray(policy.fsmActions)) {
                    for (const fsmPolicy of policy.fsmActions) {
                        // Match fsmKey (case-insensitive) or resource '*'
                        if (
                            fsmPolicy.fsmKey?.toLowerCase() ===
                                type.toLowerCase() &&
                            (fsmPolicy?.resource === '*' ||
                                instance.UserId === this.req.user.id)
                        ) {
                            allowedActions.push(...fsmPolicy.actions);
                        }
                    }
                }
            }
        }

        // filter actions based on allowed actions
        const filteredActions = actions.filter((action) =>
            allowedActions.includes(action.eventType)
        );

        let resultActions = filteredActions;

        try {
            const hooksPath = `../hooks/fsm/${type.toLowerCase()}.hooks.js`;
            let hooks;
            try {
                hooks = (await import(hooksPath)).default;
            } catch (err) {
                logger.warn(
                    `FsmService: No hooks found for ${modelName} at ${hooksPath}`,
                    err
                );
                hooks = null;
            }

            if (hooks && typeof hooks.getActions === 'function') {
                resultActions = await hooks.getActions({
                    req: this.req,
                    instance,
                    actions: resultActions,
                });
            }
        } catch (hookErr) {
            logger.error(
                `FsmService: Error executing getActions hook for ${modelName}: ${hookErr.message}`
            );
            throw hookErr;
        }

        return resultActions;
    }

    async transition(type, id, action, data = {}, file = null) {
        const modelName = this._getModelName(type);
        const instance = await this._getModelInstance(modelName, id);

        if (!instance) {
            throw new Error(`${modelName} with ID ${id} not found.`);
        }

        if (typeof instance.transition !== 'function') {
            logger.error(
                `FsmService: Model ${modelName} does not have a transition method.`
            );
            throw new Error(`Transition cannot be performed on ${modelName}.`);
        }

        // Check if the action is allowed for the user
        const allowedActions = await this.getActions(type, id);
        const isAllowed = allowedActions.some((a) => a.eventType === action);
        if (!isAllowed) {
            throw new Error(
                `Action '${action}' is not permitted for FSM '${type}' by current user policies.`
            );
        }

        // Upload file if provided
        if (file) {
            file.s3Key = `organisations/${this.req.user.OrganisationId}/files/${type}/${id}/${file?.originalname}`;
            file.s3Bucket = process.env.S3_BUCKET_NAME;
            const s3Response = await uploadFileToS3(
                file,
                file.s3Bucket,
                file.s3Key,
                process.env.MAX_FILE_SIZE,
                ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg']
            );
            if (!s3Response) {
                const errorMessage = `Failed to upload file to S3. Bucket: ${file.s3Bucket}, Key: ${file.s3Key}`;
                logger.error(
                    errorMessage,
                    s3Response?.error || 'No additional error details'
                );
                throw new Error(errorMessage);
            }
        }

        // Transition the instance with the provided action and data
        let result = await instance.transition(action, {
            ...data,
            ...this.options,
            file: file ?? null,
        });

        // Execute any post-transition hooks if defined
        try {
            // Dynamically import hooks based on type/model
            const hooksPath = `../hooks/fsm/${type.toLowerCase()}.hooks.js`;
            let hooks;
            try {
                hooks = (await import(hooksPath)).default;
            } catch (err) {
                logger.warn(
                    `FsmService: No hooks found for ${modelName} at ${hooksPath}`,
                    err
                );
                hooks = null; // No hooks defined for this type
            }

            if (
                hooks &&
                hooks[action] &&
                typeof hooks[action].postTransition === 'function'
            ) {
                result = await hooks[action].postTransition({
                    id,
                    req: this.req,
                    result,
                    data,
                });
            }
        } catch (hookErr) {
            logger.error(
                `FsmService: Error executing postTransition hook for ${modelName} action ${action}: ${hookErr.message}`
            );
            throw hookErr;
        }

        return result;
    }

    async createMachine(data) {
        const { name, key, config } = data;
        if (!name || !key || !config) {
            throw new Error('Name, key, and config are required fields');
        }

        const fsm = await this.req.db.models.StateMachine.create(
            {
                name,
                key,
                config,
                OrganisationId: this.options.tenant_id,
            },
            this.options
        );

        return fsm;
    }

    async getMachines(options = {}) {
        const machines = await this.findAll('StateMachine', {
            ...options,
            subQuery: false,
            raw: true,
            nest: false,
            tenant_safe: true,
            attributes: options.attributes || [
                'id',
                'name',
                'key',
                'config',
                'OrganisationId',
                'createdAt',
                'updatedAt',
            ],
            filters: {
                ...options.filters,
                or: [
                    { OrganisationId: this.options.tenant_id },
                    { OrganisationId: { eq: null } },
                ],
            },
        });

        if (machines?.rows?.length === 0) {
            throw new Error('No active state machines found');
        }

        return machines;
    }
}
export default FsmService;
