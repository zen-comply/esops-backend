import TenantService from './tenant.service.js';

class PlanService extends TenantService {
    constructor(req) {
        super(req);
    }

    async getPlans() {
        return await this.req.db.models.Plan.findAll({
            ...this.options,
            order: [['createdAt', 'ASC']],
        });
    }

    async createPlan(data) {
        const planData = {
            name: data.name,
            description: data.description || null,
            size: data.size,
            type: data.type || 'ESOP',
        };

        // TODO : Handle files

        const plan = await this.req.db.models.Plan.create(
            planData,
            this.options
        );
        return plan;
    }

    async updatePlan(id, data) {
        const plan = await this.req.db.models.Plan.findByPk(id, this.options);
        if (!plan) {
            throw new Error('Plan not found');
        }

        const updatableFields = ['name', 'description', 'size', 'type'];
        updatableFields.forEach((field) => {
            if (data[field] !== undefined) {
                plan[field] = data[field];
            }
        });

        await plan.save(this.options);
        return plan;
    }

    async deletePlan(id) {
        const plan = await this.req.db.models.Plan.findByPk(id, this.options);
        if (!plan) {
            throw new Error('Plan not found');
        }

        await plan.destroy(this.options);
        return { message: 'Plan deleted successfully' };
    }
}

export default PlanService;
