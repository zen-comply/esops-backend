import { expect } from 'chai';
import request from 'supertest';
import { login } from '../setup.js';
import sample from '../data/sample.js';

describe('Tests for roles api', async () => {
    let userToken;

    before(async () => {
        const response = await login(
            sample.organisation.admin.email,
            sample.organisation.admin.password
        );
        userToken = response.body.data.accessToken;
    });

    it('Should be able to get all roles', async () => {
        const response = await request(global.testServer)
            .get('/roles')
            .set(`Authorization`, `Bearer ${userToken}`);

        expect(response.status).to.equal(200);
        expect(response.body.data).to.be.an('array');
        expect(response.body.message).to.equal('Success');

        // Roles should not have 'SuperAdmin'
        const roles = response.body.data;
        const superAdmin = roles.find((role) => role.name === 'SuperAdmin');
        expect(superAdmin).to.be.undefined;
    });
});
