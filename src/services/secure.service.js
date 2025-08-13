import SequelizeService from './sequelize.service.js';
import { Op, Sequelize } from 'sequelize';

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

    async findAll(
        model,
        options = {
            attributes: [],
            include: [],
            filters: {},
            sortBy: null,
            sortOrder: 'ASC',
            page: null,
            limit: null,
            groupBy: null,
            raw: false,
            nest: true,
            subQuery: true,
            includeAttributes: true,
        }
    ) {
        let conditions = {
            ...this.options,
            raw: options.raw,
            nest: options.nest,
            subQuery: options.subQuery,
        };

        // attributes
        if (options.attributes && options.attributes.length > 0) {
            conditions.attributes = options.attributes.map((attr) => {
                if (Array.isArray(attr)) return attr;

                // Handle JSON field extraction for data.*
                const dataFieldMatch =
                    typeof attr === 'string' && attr.startsWith('data.');
                if (dataFieldMatch) {
                    const field = attr.split('.')[1];
                    // Use the model name as the table alias
                    const tableAlias =
                        typeof model === 'string' ? model : model.name;
                    return [
                        Sequelize.literal(
                            `JSON_UNQUOTE(JSON_EXTRACT(${tableAlias}.data, '$.${field}'))`
                        ),
                        field,
                    ];
                }

                // Handle dot notation or simple column with alias, e.g. 'Purchaser.legalName as purchaserLegalName' or 'name as purchaserName'
                const dotAliasMatch = attr.match(/^([\w.]+)\s+as\s+(\w+)$/i);
                if (dotAliasMatch) {
                    const [, expression, alias] = dotAliasMatch;
                    return [Sequelize.literal(expression), alias];
                }

                // Match for complex SQL expressions like CASE statements
                const caseMatch = attr.match(/(.*?) as (.*)/i);
                const keywords = ['case', 'distinct']; // Add more keywords as needed
                if (
                    caseMatch &&
                    keywords.some((keyword) =>
                        attr.toLowerCase().includes(keyword)
                    )
                ) {
                    /* eslint-disable */
                    const [_, expression, alias] = caseMatch;
                    return [Sequelize.literal(expression), alias];
                }

                // Match for aggregate functions
                const match = attr.match(
                    /(count|sum|avg|max|min|group_concat|json_arrayagg)\((.*?)\) as (.*)/i
                );
                if (match) {
                    const [, fn, col, alias] = match;
                    if (fn.toLowerCase() === 'group_concat') {
                        // Split path: all but last are table alias, last is column
                        const parts = col.split('.');
                        const tableAlias = parts.slice(0, -1).join('->');
                        const column = parts[parts.length - 1];
                        const colExpr = tableAlias
                            ? `\`${tableAlias}\`.\`${column}\``
                            : `\`${column}\``;
                        return [
                            Sequelize.literal(
                                `GROUP_CONCAT(DISTINCT ${colExpr})`
                            ),
                            alias,
                        ];
                    }
                    return [
                        Sequelize.fn(fn.toUpperCase(), Sequelize.col(col)),
                        alias,
                    ];
                }

                return attr; // Normal attribute
            });
        }

        // include
        if (options.include && options.include.length > 0)
            conditions.include = options.include;

        if (options.includeAttributes) {
            conditions.include = conditions.include || [];
            conditions.include.push({
                model: this.req.db.models.Attribute,
                required: false,
                attributes: ['key', 'value'],
            });
        }

        // Filters
        if (options.filters)
            conditions.where = this.buildFilters(options.filters);

        // Sorting
        if (options.sortBy && options.sortOrder) {
            // If sorting by a computed/literal field (like daysOverdue)
            if (typeof options.sortBy === 'object') {
                conditions.order = [
                    [options.sortBy, options.sortOrder.toUpperCase()],
                ];
            }
            // Regular sorting
            else if (!options.sortBy.includes('.')) {
                conditions.order = [
                    [options.sortBy, options.sortOrder.toUpperCase()],
                ];
            }
            // Nested sorting
            else if (options.sortBy.includes('.')) {
                const sortPath = options.sortBy.split('.'); // ["Contract", "Purchaser"]

                // Extract the model relations dynamically
                const relations = sortPath.slice(0, -1); // ["Contract", "Purchaser"]
                const field = sortPath[sortPath.length - 1]; // "alias"

                // Convert relation names into Sequelize model references
                const modelReferences = relations.map((rel) => {
                    let model = this.req.db.models[rel]; // Try to get the model directly
                    let alias = rel; // Default alias is the same as the relation name

                    // Check if `rel` exists as an alias in another model
                    if (model) return { model };
                    else {
                        const foundModel = Object.values(
                            this.req.db.models
                        ).find((m) => {
                            if (m.associations && m.associations[rel]) {
                                return true; // Found alias in this model
                            }
                            return false;
                        });

                        if (foundModel) {
                            model = foundModel.associations[rel].target; // ✅ Return the actual target model
                            alias = rel; // ✅ Keep the alias as provided in `sortBy`
                        }
                    }

                    if (!model) {
                        throw new Error(
                            `Model or alias "${rel}" not found in Sequelize models.`
                        );
                    }

                    return { model, as: alias };
                });

                // Generate the Sequelize order array
                conditions.order = [
                    [
                        ...modelReferences,
                        field,
                        options.sortOrder.toUpperCase(),
                    ],
                ];
            }
        }

        if (options.groupBy) {
            conditions.group = Array.isArray(options.groupBy)
                ? options.groupBy
                : [options.groupBy];
        }

        // Count
        const count = await this.req.db.models[model].findAll(conditions);

        // pagination
        if (options.page && options.limit) {
            conditions.limit = parseInt(options.limit);
            conditions.offset =
                (parseInt(options.page) - 1) * parseInt(options.limit);
        }

        // Get all rows
        const rows = await this.req.db.models[model].findAll(conditions);

        // Flatten Attributes if includeAttributes is true and nest is false
        if (options.includeAttributes && !options.nest && Array.isArray(rows)) {
            rows.forEach((row) => {
                // Find all keys that match Attributes.key and Attributes.value
                // Example: row['Attributes.key'], row['Attributes.value']
                // If you use raw: true, attributes will be like Attributes.key, Attributes.value, etc.
                Object.keys(row).forEach((key) => {
                    const match = key.match(/^Attributes\.(.+)$/);
                    if (
                        match &&
                        key !== 'Attributes.key' &&
                        key !== 'Attributes.value'
                    ) {
                        // Already flattened, skip
                        return;
                    }
                });
                // If you have Attributes.key and Attributes.value, set Attributes.{key} = value
                if (row['Attributes.key'] && row['Attributes.value']) {
                    row[`Attributes.${row['Attributes.key']}`] =
                        row['Attributes.value'];
                    // Optionally, remove the original keys
                    delete row['Attributes.key'];
                    delete row['Attributes.value'];
                }
            });
        }

        if (options.includeAttributes && Array.isArray(rows)) {
            rows.forEach((row) => {
                if (row.Attributes && Array.isArray(row.Attributes)) {
                    row.Attributes.forEach((attr) => {
                        row[`Attributes.${attr.key}`] = attr.value;
                    });
                    delete row.Attributes;
                }
            });
        }

        // return data
        return {
            rows,
            count: count.length,
        };
    }

    buildFilters(filters) {
        let where = {};

        Object.keys(filters).forEach((key) => {
            if (key.startsWith('Attributes.')) {
                const attrKey = key.split('.')[1];
                // Filter on Attributes.key and Attributes.value
                where['$Attributes.key$'] = attrKey;
                where['$Attributes.value$'] = this.parseOperators(filters[key]);
                return;
            }

            if (key.toLowerCase() === 'or' && Array.isArray(filters[key])) {
                // Handle OR condition
                where[Op.or] = filters[key].map((condition) =>
                    this.buildFilters(condition)
                );
            } else if (
                key.toLowerCase() === 'and' &&
                Array.isArray(filters[key])
            ) {
                // Optional: handle AND condition similarly
                where[Op.and] = filters[key].map((condition) =>
                    this.buildFilters(condition)
                );
            } else if (Array.isArray(filters[key])) {
                // Fallback: IN condition
                where[this.getKey(key)] = { [Op.in]: filters[key] };
            } else {
                // Normal condition
                where[this.getKey(key)] = this.parseOperators(filters[key]);
            }
        });

        return where;
    }

    getKey(key) {
        if (key.includes('.')) {
            const keys = key.split('.');
            return `$${keys.join('.')}$`;
        } else return key;
    }

    parseOperators(filter) {
        let parsed = {};
        if (typeof filter === 'object') {
            Object.keys(filter).forEach((op) => {
                if (Op[op]) {
                    if (op === 'like') {
                        // Wrap value with % for partial match
                        parsed[Op[op]] = `%${filter[op]}%`;
                    } else {
                        parsed[Op[op]] = filter[op];
                    }
                }
            });
        } else {
            parsed = filter;
        }
        return parsed;
    }
}

export default SecureService;
