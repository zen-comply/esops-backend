import { expect } from 'chai';
import Organisation from '../../models/organisation.model.js';
import sequelize from '../../config/database.js';

describe('Organisation Model', () => {
    before(async () => {
        await sequelize.sync({ force: true });
    });

    it('should create an organisation', async () => {
        const org = await Organisation.create({ name: 'Test Organisation' });
        expect(org).to.exist;
        expect(org.name).to.equal('Test Organisation');
    });

    it('should have a custom id', async () => {
        const org = await Organisation.create({ name: 'Test Organisation 2' });
        expect(org.id).to.match(/^org_/);
    });
});
