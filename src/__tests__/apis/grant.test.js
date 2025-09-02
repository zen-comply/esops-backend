import { expect } from 'chai';
import request from 'supertest';
import app from '../../app.js'; // Adjust path if needed

describe('Grant API', () => {
    let createdGrantId;

    it('should create a new grant', async () => {
        const res = await request(app)
            .post('/grants')
            .set('Authorization', `Bearer ${global.defaultOrg.adminToken}`)
            .send({
                UserId: global.defaultOrg.admin.id,
                PlanId: global.defaultOrg.defaultPlan.id,
                ScheduleId: global.defaultOrg.schedule1.id,
                grantDate: '2022-01-01',
                strikePrice: 10,
                granted: 100,
            });
        expect(res.status).to.equal(200);
        expect(res.body.data).to.have.property('id');
        expect(res.body.data.UserId).to.equal(global.defaultOrg.admin.id);
        createdGrantId = res.body.data.id;
    });

    it('should get all grants', async () => {
        const res = await request(app)
            .get('/grants')
            .set('Authorization', `Bearer ${global.defaultOrg.adminToken}`);
        expect(res.status).to.equal(200);
        expect(res.body.data).to.be.an('array');
        expect(res.body.data[0]).to.have.property('UserId');
    });

    it('should get grant by id', async () => {
        const res = await request(app)
            .get(`/grants/${createdGrantId}`)
            .set('Authorization', `Bearer ${global.defaultOrg.adminToken}`);
        expect(res.status).to.equal(200);
        expect(res.body.data).to.have.property('id', createdGrantId);
    });

    it('should update a grant', async () => {
        const res = await request(app)
            .put(`/grants/${createdGrantId}`)
            .set('Authorization', `Bearer ${global.defaultOrg.adminToken}`)
            .send({ granted: 200, status: 'approved' });
        expect(res.status).to.equal(200);
        expect(res.body.data.granted).to.equal(200);
        expect(res.body.data.status).to.equal('approved');
    });

    it('should get my grants', async () => {
        const res = await request(app)
            .get('/my/grants')
            .set('Authorization', `Bearer ${global.defaultOrg.adminToken}`);
        expect(res.status).to.equal(200);
        expect(res.body.data).to.be.an('array');
    });

    it('should return error for non-existent grant', async () => {
        const res = await request(app)
            .get('/grants/999999')
            .set('Authorization', `Bearer ${global.defaultOrg.adminToken}`);
        expect(res.status).to.equal(400);
        expect(res.body.errors[0]).to.equal('Grant not found');
    });
});
