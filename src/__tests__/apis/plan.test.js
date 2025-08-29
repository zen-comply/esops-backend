import { expect } from 'chai';
import request from 'supertest';
import app from '../../app.js'; // Adjust path if needed

describe('Plan API', () => {
    let createdPlanId;

    it('should create a new plan', async () => {
        const res = await request(app)
            .post('/plans')
            .set('Authorization', `Bearer ${global.defaultOrg.adminToken}`)
            .send({ name: 'API Plan', size: 50, type: 'ESOP' });
        expect(res.status).to.equal(200);
        expect(res.body.data).to.have.property('id');
        expect(res.body.data.name).to.equal('API Plan');
        createdPlanId = res.body.data.id;
    });

    it('should get all plans', async () => {
        const res = await request(app)
            .get('/plans')
            .set('Authorization', `Bearer ${global.defaultOrg.adminToken}`);
        expect(res.status).to.equal(200);
        expect(res.body.data).to.be.an('array');
        expect(res.body.data[0]).to.have.property('name');
    });

    it('should update a plan', async () => {
        const res = await request(app)
            .put(`/plans/${createdPlanId}`)
            .set('Authorization', `Bearer ${global.defaultOrg.adminToken}`)
            .send({ name: 'API Plan Updated' });
        expect(res.status).to.equal(200);
        expect(res.body.data.name).to.equal('API Plan Updated');
    });

    it('SHould be able to approve a plan', async () => {
        const res = await request(app)
            .post(`/objects/plan/${createdPlanId}/transition`)
            .set('Authorization', `Bearer ${global.defaultOrg.adminToken}`)
            .send({ action: 'APPROVE', comments: 'Testing transition' });
        expect(res.status).to.equal(200);
        expect(res.body.data).to.have.property('status', 'active');
    });

    it('should delete a plan', async () => {
        const res = await request(app)
            .delete(`/plans/${createdPlanId}`)
            .set('Authorization', `Bearer ${global.defaultOrg.adminToken}`);
        expect(res.status).to.equal(200);
        expect(res.body.data).to.have.property(
            'message',
            'Plan deleted successfully'
        );
    });

    it('should return error for deleting non-existent plan', async () => {
        const res = await request(app)
            .delete(`/plans/999999`)
            .set('Authorization', `Bearer ${global.defaultOrg.adminToken}`);
        expect(res.status).to.equal(400);
        expect(res.body.errors[0]).to.equal('Plan not found');
    });
});
