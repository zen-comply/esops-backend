import { expect } from 'chai';
import PlanService from '../../services/plan.service.js';

describe('PlanService', () => {
    let req, planService, createdPlan;

    before(() => {
        // Mock req with db.models.Plan
        req = {
            policies: [
                {
                    policy: [
                        {
                            action: [
                                'PlanService:getPlans',
                                'PlanService:createPlan',
                                'PlanService:updatePlan',
                                'PlanService:deletePlan',
                            ],
                        },
                    ],
                },
            ],
            user: {
                id: 1,
                OrganisationId: global.defaultOrg.id,
            },
            options: {
                tenant_id: global.defaultOrg.id,
            },
        };
        planService = new PlanService(req);
    });

    it('should create a plan', async () => {
        const data = { name: 'New Plan', size: 100 };
        createdPlan = await planService.createPlan(data);
        expect(createdPlan).to.have.property('id');
        expect(createdPlan.name).to.equal('New Plan');
    });

    it('should get all plans', async () => {
        const plans = await planService.getPlans();
        expect(plans).to.be.an('array');
        expect(plans[0]).to.have.property('name', 'New Plan');
    });

    it('should update a plan', async () => {
        const updated = await planService.updatePlan(createdPlan.id, {
            name: 'Updated Plan',
        });
        expect(updated).to.have.property('name', 'Updated Plan');
    });

    it('should throw error if plan not found for update', async () => {
        try {
            await planService.updatePlan(999, { name: 'No Plan' });
            throw new Error('Should have thrown');
        } catch (err) {
            expect(err.message).to.equal('Plan not found');
        }
    });

    it('should delete a plan', async () => {
        const result = await planService.deletePlan(createdPlan.id);
        expect(result).to.have.property('message', 'Plan deleted successfully');
    });

    it('should throw error if plan not found for delete', async () => {
        try {
            await planService.deletePlan(createdPlan.id);
            throw new Error('Should have thrown');
        } catch (err) {
            expect(err.message).to.equal('Plan not found');
        }
    });
});
