import { expect } from 'chai';
import OrganisationService from '../../services/organisation.service.js';
import db from '../../config/database.js';

describe('Tests for organisation service', async () => {
    let org = null;

    after(async () => {
        // Delete the organisation
        await db.models.Organisation.destroy({
            where: { id: org.id },
            force: true,
        });
    });

    it('Should test getting multiple orgs', async () => {
        const orgs = await new OrganisationService({
            policies: [
                {
                    policy: [
                        {
                            action: ['OrganisationService:getOrganisations'],
                        },
                    ],
                },
            ],
        }).getOrganisations(1, 1);
        expect(orgs).to.be.an('object');
        expect(orgs.data).to.be.an('array');
        expect(orgs.data.length).to.be.equal(1);
    });

    it('Should fail to get multiple orgs without a valid policy', async () => {
        try {
            new OrganisationService({
                policies: [],
            }).getOrganisations(1, 1);
        } catch (error) {
            expect(error).to.be.an('error');
            expect(error.message).to.be.equal(
                'Access denied: Missing permission for OrganisationService:getOrganisations'
            );
        }
    });

    it('Should create an org with the correct permissions', async () => {
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
            name: 'Test org',
        });
        expect(org).to.be.an('object');
    });

    it('Should fail to create the org without the correct permissions', async () => {
        try {
            new OrganisationService({
                policies: [],
            }).createOrganisation({
                name: 'Test org',
            });
        } catch (error) {
            expect(error).to.be.an('error');
            expect(error.message).to.be.equal(
                'Access denied: Missing permission for OrganisationService:createOrganisation'
            );
        }
    });

    it('Should be able to udpate an org with the correct permissions', async () => {
        const response = await new OrganisationService({
            policies: [
                {
                    policy: [
                        {
                            action: ['OrganisationService:updateOrganisation'],
                        },
                    ],
                },
            ],
        }).updateOrganisation(org.id, {
            name: 'Test org 1',
            context: 'Test org',
        });

        expect(response).to.be.an('array');
        const updatedOrg = await db.models.Organisation.findByPk(org.id);
        expect(updatedOrg.name).to.be.equal('Test org 1');
        expect(updatedOrg.context).to.be.equal('Test org');
    });

    it('Should be able to delete an org with the correct permissions', async () => {
        const response = await new OrganisationService({
            policies: [
                {
                    policy: [
                        {
                            action: ['OrganisationService:deleteOrganisation'],
                        },
                    ],
                },
            ],
        }).deleteOrganisation(org.id);

        expect(response).to.be.equal(1);
    });
});
