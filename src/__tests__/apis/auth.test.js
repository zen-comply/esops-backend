import { expect } from 'chai';
import request from 'supertest';

describe('Auth tests', async () => {
    it('Should test if the the login api rejects an invalid user', async () => {
        const response = await request(global.testServer)
            .post('/auth/login')
            .send({
                email: 'invalid@example.com',
                password: 'wrongpassword',
            });
        expect(response.status).to.equal(401);
        expect(response.body.errors[0]).to.equal('User not found');
    });
});
