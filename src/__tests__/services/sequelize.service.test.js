import { expect } from 'chai';
import SequelizeService from '../../services/sequelize.service.js';

describe('Tests for sequelize service', async () => {
    it('Should fail to int a sequelize service without a req object', async () => {
        try {
            new SequelizeService();
        } catch (error) {
            expect(error).to.be.an('error');
        }
    });

    it('Should test int a sequelize service with a req object', async () => {
        const sequelizeService = new SequelizeService({
            options: {
                tenant_safe: true,
            },
        });
        expect(sequelizeService).to.be.an('object');
        expect(sequelizeService.options).to.be.an('object');
        expect(sequelizeService.options.tenant_safe).to.be.equal(true);
    });
});
