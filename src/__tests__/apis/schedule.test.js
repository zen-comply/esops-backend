import { expect } from 'chai';
import request from 'supertest';
import app from '../../app.js'; // Adjust path if needed

describe('Schedule API', () => {
    let createdScheduleId;

    it('should create a new schedule', async () => {
        const res = await request(app)
            .post('/schedules')
            .set('Authorization', `Bearer ${global.defaultOrg.adminToken}`)
            .send({
                title: 'Vesting Schedule',
                description: 'Standard 4-year vesting with 1-year cliff',
                cliff: 12,
                periods: [
                    { period: 12, percentage: 25, frequency: 1 },
                    { period: 36, percentage: 75, frequency: 1 },
                ],
            });
        expect(res.status).to.equal(200);
        expect(res.body.data).to.have.property('id');
        expect(res.body.data.title).to.equal('Vesting Schedule');
        createdScheduleId = res.body.data.id;
    });

    it('should get all schedules', async () => {
        const res = await request(app)
            .get('/schedules')
            .set('Authorization', `Bearer ${global.defaultOrg.adminToken}`);
        expect(res.status).to.equal(200);
        expect(res.body.data).to.be.an('array');
        expect(res.body.data[0]).to.have.property('title');
    });

    it('should update a schedule', async () => {
        const res = await request(app)
            .put(`/schedules/${createdScheduleId}`)
            .set('Authorization', `Bearer ${global.defaultOrg.adminToken}`)
            .send({ title: 'Updated Schedule' });
        expect(res.status).to.equal(200);
        expect(res.body.data.title).to.equal('Updated Schedule');
    });

    it('should delete a schedule', async () => {
        const res = await request(app)
            .delete(`/schedules/${createdScheduleId}`)
            .set('Authorization', `Bearer ${global.defaultOrg.adminToken}`);
        expect(res.status).to.equal(200);
        expect(res.body.data).to.have.property(
            'message',
            'Schedule deleted successfully'
        );
    });

    it('should return error for deleting non-existent schedule', async () => {
        const res = await request(app)
            .delete(`/schedules/999999`)
            .set('Authorization', `Bearer ${global.defaultOrg.adminToken}`);
        expect(res.status).to.equal(400);
        expect(res.body.errors[0]).to.equal('Schedule not found');
    });
});
