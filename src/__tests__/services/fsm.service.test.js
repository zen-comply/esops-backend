import { expect } from 'chai';
import FsmService from '../../services/fsm.service.js';
import UserService from '../../services/user.service.js';
import db from '../../config/database.js';

const sampleUser = {
    email: 'userForFsm@example.com',
    firstName: 'User',
    lastName: 'For fsm',
    password: 'password',
};

describe('FsmService', () => {
    let req, user;

    before(async () => {
        req = {
            policies: [
                {
                    policy: [
                        {
                            action: [
                                'FsmService:getActions',
                                'FsmService:transition',
                                'FsmService:createMachine',
                                'FsmService:getMachines',
                                'UserService:createUser',
                                'UserService:getUserById',
                            ],
                        },
                    ],
                    fsmActions: [
                        {
                            fsmKey: 'user',
                            actions: ['APPROVE', 'REJECT', 'EXIT'],
                            resource: '*',
                        },
                    ],
                },
            ],
            options: {
                tenant_id: global.defaultOrg.id,
            },
            user: {
                id: global.defaultOrg.admin.id,
                OrganisationId: global.defaultOrg.id,
            },
        };

        // Create user for testing
        const role = await db.models.Role.findOne({ where: { name: 'Admin' } });
        user = await new UserService(req).createUser(sampleUser, [role]);
    });

    after(async () => {
        // Clean up created user
        await db.models.User.destroy({
            where: { email: sampleUser.email },
            force: true,
        });
    });

    describe('getActions', () => {
        it('should return available actions for a given object type and ID', async () => {
            const fsmService = new FsmService(req);
            const type = 'user';
            const id = user.id;

            const actions = await fsmService.getActions(type, id);

            expect(actions).to.be.an('array');
            expect(actions.length).to.be.greaterThan(0);
        });

        it('should throw an error if the model instance is not found', async () => {
            const fsmService = new FsmService(req);
            const type = 'user';
            const id = 9999; // Assuming no user with this ID exists

            try {
                await fsmService.getActions(type, id);
                throw new Error('Expected an error to be thrown');
            } catch (error) {
                expect(error.message).to.equal(`User with ID ${id} not found.`);
            }
        });
    });

    describe('transition', () => {
        it('should perform a transition on the given object type and ID', async () => {
            const fsmService = new FsmService(req);
            const type = 'user';
            const id = user.id; // Use the created user ID
            const action = 'APPROVE'; // Assuming 'APPROVE' is a valid action

            const result = await fsmService.transition(type, id, action, {
                comments: 'Test comment',
            });

            expect(result).to.be.an('object');
            expect(result.id).to.equal(id);
            expect(result.status).to.equal('active');
        });

        it('should throw an error if the action is not valid', async () => {
            const fsmService = new FsmService(req);
            const type = 'user';
            const id = user.id; // Use the created user ID
            const action = 'invalidAction'; // Assuming this action does not exist

            try {
                await fsmService.transition(type, id, action);
                throw new Error('Expected an error to be thrown');
            } catch (error) {
                expect(error.message).to.include(
                    `Action 'invalidAction' is not permitted for FSM 'user' by current user policies.`
                );
            }
        });
    });

    describe('State Machine CRUD', () => {
        let fsmService, createdFsm;

        before(() => {
            fsmService = new FsmService(req);
        });

        it('should create a new state machine', async () => {
            const data = {
                name: 'Test FSM',
                key: 'test_fsm',
                config: { states: ['draft', 'approved'], transitions: [] },
            };
            createdFsm = await fsmService.createMachine(data);
            expect(createdFsm).to.have.property('id');
            expect(createdFsm.name).to.equal('Test FSM');
            expect(createdFsm.key).to.equal('test_fsm');
            expect(createdFsm.config).to.deep.equal(data.config);
        });

        it('should get state machines for the tenant', async () => {
            const fsms = await fsmService.getMachines();
            expect(fsms.rows).to.be.an('array');
            const found = fsms.rows.find((fsm) => fsm.id === createdFsm.id);
            expect(found).to.not.be.undefined;
            expect(found.name).to.equal('Test FSM');
        });

        it('should throw error if required fields are missing when creating', async () => {
            try {
                await fsmService.createMachine({
                    name: '',
                    key: '',
                    config: null,
                });
                throw new Error('Should have thrown');
            } catch (err) {
                expect(err.message).to.equal(
                    'Name, key, and config are required fields'
                );
            }
        });
    });
});
