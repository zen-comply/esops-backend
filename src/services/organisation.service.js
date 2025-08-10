import SecureService from './secure.service.js';

class OrganisationService extends SecureService {
    constructor(req) {
        super(req);
    }

    async getOrganisations(page, limit) {
        const offset = (page - 1) * limit;

        const orgs = await this.req.db.models.Organisation.findAndCountAll({
            limit: limit,
            offset: offset,
            ...this.options,
        });

        return {
            total: orgs.count,
            page,
            limit,
            data: orgs.rows,
        };
    }

    async createOrganisation(data) {
        return await this.req.db.models.Organisation.create(data, this.options);
    }

    async updateOrganisation(id, data) {
        const updatedData = {};

        data.name && (updatedData.name = data.name);
        data.context && (updatedData.context = data.context);

        return await this.req.db.models.Organisation.update(updatedData, {
            where: { id },
            ...this.options,
        });
    }

    async deleteOrganisation(id) {
        return await this.req.db.models.Organisation.destroy({
            where: { id },
            ...this.options,
        });
    }
}

export default OrganisationService;
