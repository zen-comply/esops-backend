import { expect } from 'chai';
import GrantService from '../../services/grant.service.js';

describe('GrantService', () => {
    let req, grantService, createdGrant;

    before(() => {
        // Mock req with db.models.Grant and related models
        req = {
            policies: [
                {
                    policy: [
                        {
                            action: [
                                'GrantService:getGrants',
                                'GrantService:createGrant',
                                'GrantService:updateGrant',
                                'GrantService:deleteGrant',
                                'GrantService:getMyGrants',
                                'GrantService:getGrantById',
                            ],
                        },
                    ],
                },
            ],
            user: {
                id: global.defaultOrg.admin.id,
                OrganisationId: global.defaultOrg.id,
            },
            options: {
                tenant_id: global.defaultOrg.id,
            },
        };
        grantService = new GrantService(req);
    });

    it('should create a grant', async () => {
        const data = {
            UserId: global.defaultOrg.admin.id,
            PlanId: global.defaultOrg.defaultPlan.id,
            ScheduleId: global.defaultOrg.schedule1.id,
            grantDate: '2022-01-01',
            strikePrice: 10,
            granted: 100,
        };
        createdGrant = await grantService.createGrant(data);
        expect(createdGrant).to.have.property('id');
        expect(createdGrant.UserId).to.equal(global.defaultOrg.admin.id);
        expect(createdGrant.status).to.equal('draft');
    });

    it('should get all grants', async () => {
        const grants = await grantService.getGrants();
        expect(grants).to.be.an('array');
        expect(grants[0]).to.have.property('id');
    });

    it('should get grant by id', async () => {
        const grant = await grantService.getGrantById(createdGrant.id);
        expect(grant).to.have.property('id', createdGrant.id);
    });

    it('should throw error if grant not found by id', async () => {
        try {
            await grantService.getGrantById(999);
            throw new Error('Should have thrown');
        } catch (err) {
            expect(err.message).to.equal('Grant not found');
        }
    });

    it('should update a grant', async () => {
        const updated = await grantService.updateGrant(createdGrant.id, {
            granted: 200,
            status: 'approved',
        });
        expect(updated).to.have.property('granted', 200);
        expect(updated).to.have.property('status', 'approved');
    });

    it('should throw error if grant not found for update', async () => {
        try {
            await grantService.updateGrant(999, { granted: 200 });
            throw new Error('Should have thrown');
        } catch (err) {
            expect(err.message).to.equal('Grant not found');
        }
    });

    it('should get my grants', async () => {
        const grants = await grantService.getMyGrants();
        expect(grants).to.be.an('array');
        expect(grants[0]).to.have.property('id');
    });
});
