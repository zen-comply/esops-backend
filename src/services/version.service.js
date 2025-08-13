import TenantService from './tenant.service.js';

class VersionService extends TenantService {
    constructor(req) {
        super(req);
    }

    async getVersions(options = {}) {
        let versions = await this.findAll('Version', {
            ...options,
            ...this.options,
            include: [
                {
                    model: this.req.db.models.User,
                    as: 'Actor',
                },
                {
                    model: this.req.db.models.File,
                },
            ],
        });

        // Add file URLs
        for (let version of versions.rows) {
            if (version.Files) {
                for (let file of version.Files) {
                    file.setDataValue('url', await file.getUrl());
                }
            }
        }

        return versions;
    }
}

export default VersionService;
