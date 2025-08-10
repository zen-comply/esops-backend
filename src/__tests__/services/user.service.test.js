import { expect } from 'chai';
import UserService from '../../services/user.service.js';
import OrganisationService from '../../services/organisation.service.js';
import db from '../../config/database.js';

const sampleUser1 = {
    email: 'testuser@example.com',
    firstName: 'Test',
    lastName: 'User',
    password: 'password',
};

const sampleUser2 = {
    email: 'testuser2@example.com',
    firstName: 'Test',
    lastName: 'User2',
    password: 'password',
};

describe('Tests for user service', async () => {
    let org, user;

    before(async () => {
        // Create an organisation
        org = await new OrganisationService({
            policies: [
                {
                    policy: [
                        {
                            action: ['OrganisationService:createOrganisation'],
                        },
                    ],
                },
            ],
        }).createOrganisation({
            name: 'Test org for user',
        });
    });

    after(async () => {
        // Delete the organisation
        await db.models.Organisation.destroy({
            where: { id: org.id },
            force: true,
        });
        await db.models.User.destroy({
            where: { email: sampleUser1.email },
            force: true,
        });
        await db.models.User.destroy({
            where: { email: sampleUser2.email },
            force: true,
        });
    });

    it('It should create a user with roles', async () => {
        const role = await db.models.Role.findOne({ where: { name: 'Admin' } });
        user = await new UserService({
            policies: [
                {
                    policy: [
                        {
                            action: ['UserService:createUser'],
                        },
                    ],
                },
            ],
            user: {
                id: 1,
                OrganisationId: org.id,
            },
            options: {
                tenant_id: org.id,
            },
        }).createUser(sampleUser2, [role]);
        expect(user).to.be.an('object');
        const roles = await user.getRoles();
        expect(roles).to.be.an('array');
        expect(roles[0].name).to.be.equal('Admin');
    });

    it('Should be able to get all users', async () => {
        const users = await new UserService({
            policies: [
                {
                    policy: [
                        {
                            action: ['UserService:getUsers'],
                        },
                    ],
                },
            ],
            options: {
                tenant_id: org.id,
            },
            user: {
                id: 1,
                OrganisationId: org.id,
            },
        }).getUsers(1, 10);
        expect(users).to.be.an('object');
        expect(users.data.length).to.be.greaterThan(0);
        expect(users.data[0].Roles).to.be.an('array');
    });

    it('Should be able to get a user', async () => {
        const user = await new UserService({
            policies: [
                {
                    policy: [
                        {
                            action: ['UserService:getUsers'],
                        },
                    ],
                },
            ],
            user: {
                id: 1,
                OrganisationId: org.id,
            },
            options: {
                tenant_id: org.id,
            },
        }).getUsers(1, 1);
        expect(user).to.be.an('object');
        expect(user.data.length).to.be.equal(1);
    });

    it('Should be able to update a user', async () => {
        const updatedUser = await new UserService({
            policies: [
                {
                    policy: [
                        {
                            action: ['UserService:updateUser'],
                        },
                    ],
                },
            ],
            user: {
                id: 1,
                OrganisationId: org.id,
            },
            options: {
                tenant_id: org.id,
            },
        }).updateUser(user.id, {
            ...sampleUser2,
            firstName: 'Updated',
            lastName: 'User',
        });
        expect(updatedUser).to.be.an('object');
        expect(updatedUser.firstName).to.be.equal('Updated');
    });

    it('Should be able to delete a user', async () => {
        const deletedUser = await new UserService({
            policies: [
                {
                    policy: [
                        {
                            action: ['UserService:deleteUser'],
                        },
                    ],
                },
            ],
            user: {
                id: 1,
                OrganisationId: org.id,
            },
            options: {
                tenant_id: org.id,
            },
        }).deleteUser(user.id);
        expect(deletedUser).to.be.an('object');
    });
});

describe('Tests for user service - Roles', async () => {
    it('Should get all roles', async () => {
        const roles = await new UserService({
            policies: [
                {
                    policy: [
                        {
                            action: ['UserService:getRoles'],
                        },
                    ],
                },
            ],
            options: {
                tenant_id: 1,
            },
            user: {
                id: 1,
                OrganisationId: 1,
            },
        }).getRoles();
        expect(roles).to.be.an('array');
    });
});
