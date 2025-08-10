import { expect } from 'chai';
import RolesService from '../../services/roles.service.js';

describe('Tests for roles service', async () => {
    it('Should be able to get roles with correct permissions', async () => {
        const roles = await new RolesService({
            policies: [
                {
                    policy: [
                        {
                            action: ['RolesService:getRoles'],
                        },
                    ],
                },
            ],
        }).getRoles();

        expect(roles).to.be.an('array');
        expect(roles.length).to.be.greaterThan(0);
    });
});
