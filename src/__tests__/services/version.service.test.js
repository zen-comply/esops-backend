import { expect } from 'chai';
import VersionService from '../../services/version.service.js';

describe('VersionService', () => {
    it('Should be able to get all versions for users', async () => {
        const versions = await new VersionService({
            policies: [
                {
                    policy: [{ action: ['VersionService:getVersions'] }],
                },
            ],
            options: { tenant_id: global.defaultOrg.id },
            user: {
                id: global.defaultOrg.admin.id,
                OrganisationId: global.defaultOrg.id,
            },
        }).getVersions({
            page: 1,
            limit: 10,
            sortBy: 'createdAt',
            sortOrder: 'ASC',
            attributes: null,
            filters: {
                versionFor: 'user',
            },
        });
        expect(versions.rows.length).to.be.greaterThan(0);
        versions.rows.forEach((version) => {
            expect(version.versionFor).to.be.equal('user');
        });
    });
});
