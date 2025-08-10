import SecureService from './secure.service.js';
import { Op } from 'sequelize';

class RolesService extends SecureService {
    constructor(req) {
        super(req);
    }

    async getRoles() {
        return await this.req.db.models.Role.findAll({
            where: {
                name: {
                    [Op.ne]: 'SuperAdmin',
                },
            },
        });
    }
}

export default RolesService;
