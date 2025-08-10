import SecureService from './secure.service.js';

class TenantService extends SecureService {
    constructor(req) {
        super(req);

        if (!this.options.tenant_id && !this.options.tenant_safe) {
            throw new Error('Tenant is not set!');
        }

        // Check tenant id
        if (
            req.user.OrganisationId !== this.options.tenant_id &&
            !this.options.tenant_safe
        ) {
            throw new Error('Tenant ID is invalid!');
        }

        // Add to common functions
        this.internalFunctions.push('getOrganisation');
    }

    async getOrganisation() {
        return await this.req.db.models.Organisation.findByPk(
            this.options.tenant_id
        );
    }
}

export default TenantService;
