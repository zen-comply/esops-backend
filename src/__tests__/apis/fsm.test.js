import { expect } from 'chai';
import request from 'supertest';
import { createUser, getRoles } from './user.test.js';
import db from '../../config/database.js';
import { login } from '../setup.js';

const sampleUser = {
    firstName: 'John 1',
    lastName: 'Doe',
    email: 'john.doe1@example.com',
    password: 'password',
};

describe('FSM API tests', () => {
    let adminToken, machineId, user, roles;

    before(async () => {
        // You may need to create a user and an invoice here, or use global fixtures
        adminToken = global.defaultOrg.adminToken;

        roles = await getRoles(adminToken);

        // Create user for testing
        const response = await createUser(
            {
                ...sampleUser,
                roles: roles.body.data.map((role) => role.id),
            },
            adminToken
        );
        user = response.body.data;
    });

    after(async () => {
        // Clean up created user
        await db.models.User.destroy({
            where: { email: sampleUser.email },
            force: true,
        });
    });

    it('should get available FSM actions for a user', async () => {
        const response = await request(global.testServer)
            .get(`/objects/user/${user.id}/actions`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(response.status).to.equal(200);
        expect(response.body.data).to.be.an('array');
    });

    it('should perform a transition on an invoice', async () => {
        const response = await request(global.testServer)
            .post(`/objects/user/${user.id}/transition`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ action: 'APPROVE', comments: 'Testing transition' });
        expect(response.status).to.equal(200);
        expect(response.body.data).to.be.an('object');
        expect(response.body.data.id).to.equal(user.id);
    });

    it('should return error for invalid transition', async () => {
        const response = await request(global.testServer)
            .post(`/objects/user/${user.id}/transition`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ action: 'INVALID_ACTION' });
        expect(response.status).to.equal(400);
        expect(response.body.errors).to.be.an('array');
    });

    describe('FSM State Machine API', () => {
        it('should create a new state machine', async () => {
            const response = await request(global.testServer)
                .post('/objects/machines')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Test Machine',
                    key: 'test_machine',
                    config: { states: ['draft', 'approved'], transitions: [] },
                });
            expect(response.status).to.equal(200);
            expect(response.body.data).to.have.property('id');
            expect(response.body.data.name).to.equal('Test Machine');
            expect(response.body.data.key).to.equal('test_machine');
            machineId = response.body.data.id;
        });

        it('should get state machines', async () => {
            const response = await request(global.testServer)
                .get('/objects/machines')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(response.status).to.equal(200);
            expect(response.body.data.rows).to.be.an('array');
            const found = response.body.data.rows.find(
                (m) => m.id === machineId
            );
            expect(found).to.not.be.undefined;
            expect(found.name).to.equal('Test Machine');
        });

        it('should return error if required fields are missing when creating', async () => {
            const response = await request(global.testServer)
                .post('/objects/machines')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: '', key: '', config: null });
            expect(response.status).to.equal(400);
            expect(response.body.errors[0]).to.equal(
                'Name, key, and config are required fields'
            );
        });
    });
});

describe('FSM tests for maker and approver', () => {
    let user, adminToken;

    const makerSample = {
        firstName: 'Maker',
        lastName: 'User',
        email: 'maker.user@example.com',
        password: 'password',
    };

    const approverSample = {
        firstName: 'Approver',
        lastName: 'User',
        email: 'approver@example.com',
        password: 'password',
    };

    const userSample = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test.user@example.com',
        password: 'password',
    };

    before(async () => {
        adminToken = global.defaultOrg.adminToken;

        const roles = await getRoles(adminToken);

        // Create maker and approver users
        const makerResponse = await createUser(
            {
                ...makerSample,
                roles: roles.body.data
                    .filter((role) => role.name === 'User')
                    .map((role) => role.id),
            },
            adminToken
        );
        // approve maker
        await request(global.testServer)
            .post(`/objects/user/${makerResponse.body.data.id}/transition`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ action: 'APPROVE', comments: 'Approve maker' });

        const approverResponse = await createUser(
            {
                ...approverSample,
                roles: roles.body.data
                    .filter((role) => role.name === 'Approver')
                    .map((role) => role.id),
            },
            adminToken
        );
        await request(global.testServer)
            .post(`/objects/user/${approverResponse.body.data.id}/transition`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ action: 'APPROVE', comments: 'Approve approver' });

        const userResponse = await createUser(
            {
                ...userSample,
                roles: roles.body.data
                    .filter((role) => role.name === 'User')
                    .map((role) => role.id),
            },
            adminToken
        );
        user = userResponse.body.data;
    });

    after(async () => {
        // Clean up created users
        await db.models.User.destroy({
            where: { email: makerSample.email },
            force: true,
        });
        await db.models.User.destroy({
            where: { email: approverSample.email },
            force: true,
        });
        await db.models.User.destroy({
            where: { email: userSample.email },
            force: true,
        });
    });

    it('Should not allow maker to approve a user', async () => {
        // login as maker
        const makerResponse = await login(
            makerSample.email,
            makerSample.password
        );
        const makerToken = makerResponse.body.data.accessToken;

        const response = await request(global.testServer)
            .post(`/objects/user/${user.id}/transition`)
            .set('Authorization', `Bearer ${makerToken}`)
            .send({ action: 'APPROVE', comments: 'Maker trying to approve' });
        expect(response.status).to.equal(400);
        expect(response.body.message).to.equal('Error');
    });

    it('Should allow approver to approve a user', async () => {
        // login as approver
        const approverResponse = await login(
            approverSample.email,
            approverSample.password
        );
        const approverToken = approverResponse.body.data.accessToken;

        const response = await request(global.testServer)
            .post(`/objects/user/${user.id}/transition`)
            .set('Authorization', `Bearer ${approverToken}`)
            .send({ action: 'APPROVE', comments: 'Approver approving user' });
        expect(response.status).to.equal(200);
        expect(response.body.data.id).to.equal(user.id);
    });
});
