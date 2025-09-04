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

    async getPlanWithSummary(planId) {
        const { Plan, Grant } = this.req.db.models;
        const plan = await Plan.findByPk(planId, this.options);
        if (!plan) throw new Error('Plan not found');
        const planSize = parseFloat(plan.size) || 0;

        const summary = await Grant.findOne({
            ...this.options,
            where: { PlanId: planId },
            attributes: [
                [
                    Grant.sequelize.fn('SUM', Grant.sequelize.col('vested')),
                    'vested',
                ],
                [
                    Grant.sequelize.fn('SUM', Grant.sequelize.col('unvested')),
                    'unvested',
                ],
                [
                    Grant.sequelize.fn(
                        'SUM',
                        Grant.sequelize.col('surrendered')
                    ),
                    'surrendered',
                ],
                [
                    Grant.sequelize.fn('SUM', Grant.sequelize.col('cancelled')),
                    'cancelled',
                ],
                [
                    Grant.sequelize.fn('SUM', Grant.sequelize.col('exercised')),
                    'exercised',
                ],
                [
                    Grant.sequelize.fn('SUM', Grant.sequelize.col('sold')),
                    'sold',
                ],
            ],
            raw: true,
        });

        // Parse and default to 0
        const vested = parseFloat(summary.vested) || 0;
        const unvested = parseFloat(summary.unvested) || 0;
        const surrendered = parseFloat(summary.surrendered) || 0;
        const cancelled = parseFloat(summary.cancelled) || 0;
        const exercised = parseFloat(summary.exercised) || 0;
        const sold = parseFloat(summary.sold) || 0;
        const unsold = exercised - sold;

        // Split and totals
        return {
            id: plan.id,
            name: plan.name,
            size: planSize,
            summary: {
                size: {
                    value: planSize,
                    split: {
                        available: planSize - (vested + unvested),
                        vested,
                        unvested,
                    },
                    total: planSize,
                },
                granted: {
                    value: vested + unvested + surrendered + cancelled,
                    split: {
                        vested,
                        unvested,
                        surrendered,
                        cancelled,
                    },
                    total: vested + unvested + surrendered + cancelled,
                },
                vested: {
                    value: exercised + (vested - exercised),
                    split: {
                        exercised,
                        unexercised: vested - exercised,
                    },
                    total: vested,
                },
                exercised: {
                    value: sold + unsold,
                    split: {
                        sold,
                        unsold,
                    },
                    total: exercised,
                },
                surrendered: {
                    value: surrendered,
                    total: surrendered,
                },
                cancelled: {
                    value: cancelled,
                    total: cancelled,
                },
            },
        };
    }
}

export default PlanService;
