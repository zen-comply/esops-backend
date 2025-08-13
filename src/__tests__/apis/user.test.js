import request from 'supertest';
import { expect } from 'chai';
import { login } from '../setup.js';
import sample from '../data/sample.js';
import db from '../../config/database.js';

const sampleUser = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: 'password',
};

describe('Manage user apis', () => {
    let adminToken, roles, user;

    before(async () => {
        const response = await login(
            sample.organisation.admin.email,
            sample.organisation.admin.password
        );
        adminToken = response.body.data.accessToken;

        roles = await getRoles(adminToken);
    });

    after(async () => {
        await db.models.User.destroy({
            where: { email: sampleUser.email },
            force: true,
        });
    });

    it('Should not be able to create a user without firstName', async () => {
        const response = await createUser({}, adminToken);
        expect(response.status).to.equal(400);
        expect(response.body.message).to.equal('Error');
    });

    it('Should not be able to create a user without lastName', async () => {
        const response = await createUser({ firstName: 'John' }, adminToken);
        expect(response.status).to.equal(400);
        expect(response.body.message).to.equal('Error');
    });

    it('Should not be able to create a user without email', async () => {
        const response = await createUser(
            { firstName: 'John', lastName: 'Doe' },
            adminToken
        );
        expect(response.status).to.equal(400);
        expect(response.body.message).to.equal('Error');
    });

    it('Should not be able to create a user without password', async () => {
        const response = await createUser(
            {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
            },
            adminToken
        );
        expect(response.status).to.equal(400);
        expect(response.body.message).to.equal('Error');
    });

    it('Should not be able to create a user without roles', async () => {
        const response = await createUser(
            {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                password: 'password',
            },
            adminToken
        );
        expect(response.status).to.equal(400);
        expect(response.body.message).to.equal('Error');
    });

    it('Should be able to create a user with roles', async () => {
        const response = await createUser(
            {
                ...sampleUser,
                roles: roles.body.data.map((role) => role.id),
            },
            adminToken
        );
        expect(response.status).to.equal(200);
        expect(response.body.message).to.equal('Success');
        expect(response.body.data).to.be.an('object');
        user = response.body.data;
    });

    it('Should be able to get all users', async () => {
        const response = await getUsers(adminToken);
        expect(response.status).to.equal(200);
        expect(response.body.message).to.equal('Success');
        expect(response.body.data).to.be.an('object');
    });

    it('Should be able to update a user', async () => {
        const users = await getUsers(adminToken);
        const user = users.body.data.data.find(
            (user) => user.email === 'john.doe@example.com'
        );
        const response = await updateUser(
            user.id,
            {
                ...sampleUser,
                firstName: 'Jane',
                roles: roles.body.data.map((role) => role.id),
            },
            adminToken
        );
        expect(response.status).to.equal(200);
        expect(response.body.message).to.equal('Success');
        expect(response.body.data).to.be.an('object');
        expect(response.body.data.firstName).to.equal('Jane');
    });

    it('Should be able to delete a user', async () => {
        const response = await deleteUser(user.id, adminToken);
        expect(response.status).to.equal(200);
        expect(response.body.message).to.equal('Success');
    });
});

describe('Tests for current user api', async () => {
    it('Should be able to get current user', async () => {
        const response = await request(global.testServer)
            .get('/me')
            .set(`Authorization`, `Bearer ${global.defaultOrg.adminToken}`);
        expect(response.status).to.equal(200);
        expect(response.body.message).to.equal('Success');
        expect(response.body.data).to.be.an('object');
        expect(response.body.data).to.not.have.property('password');
        expect(response.body.data.user).to.have.property('Organisation');
    });

    it('Should be able to fetch current user for super admin', async () => {
        const response = await request(global.testServer)
            .get('/me')
            .set(`Authorization`, `Bearer ${global.superUserToken}`);
        expect(response.status).to.equal(200);
        expect(response.body.message).to.equal('Success');
        expect(response.body.data).to.be.an('object');
        expect(response.body.data).to.not.have.property('password');
        expect(response.body.data.user).to.have.property('Organisation');
    });
});

export const createUser = async (data, creatorToken) => {
    return await request(global.testServer)
        .post('/users')
        .set(`Authorization`, `Bearer ${creatorToken}`)
        .send(data);
};

export const getRoles = async (token) => {
    return await request(global.testServer)
        .get('/roles')
        .set(`Authorization`, `Bearer ${token}`);
};

export const getUsers = async (token) => {
    return await request(global.testServer)
        .get('/users?page=1&limit=10')
        .set(`Authorization`, `Bearer ${token}`);
};

export const updateUser = async (id, data, token) => {
    return await request(global.testServer)
        .put(`/users/${id}`)
        .set(`Authorization`, `Bearer ${token}`)
        .send(data);
};

export const deleteUser = async (id, token) => {
    return await request(global.testServer)
        .delete(`/users/${id}`)
        .set(`Authorization`, `Bearer ${token}`);
};
