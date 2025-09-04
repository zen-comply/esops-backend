import TenantService from './tenant.service.js';
import { Op } from 'sequelize';
class GrantService extends TenantService {
    constructor(req) {
        super(req);
    }

    async createGrant(data) {
        // Only pick fields relevant for Grant creation
        const grantData = {
            UserId: data.UserId,
            PlanId: data.PlanId,
            ScheduleId: data.ScheduleId,
            grantDate: data.grantDate,
            strikePrice: data.strikePrice,
            granted: data.granted,
            status: 'draft',
        };
        const grant = await this.req.db.models.Grant.create(
            grantData,
            this.options
        );
        return grant;
    }

    async getGrants() {
        return await this.req.db.models.Grant.findAll({
            ...this.options,
            order: [['createdAt', 'ASC']],
            include: [
                this.req.db.models.User,
                this.req.db.models.Plan,
                this.req.db.models.Schedule,
                {
                    model: this.req.db.models.Vest,
                    order: [['date', 'ASC']],
                },
            ],
        });
    }

    async getGrantById(id) {
        const grant = await this.req.db.models.Grant.findOne({
            ...this.options,
            where: {
                id: id,
            },
            include: [
                this.req.db.models.User,
                this.req.db.models.Plan,
                this.req.db.models.Schedule,
                this.req.db.models.Vest,
            ],
        });
        if (!grant) {
            throw new Error('Grant not found');
        }
        return grant;
    }

    async updateGrant(id, data) {
        const grant = await this.req.db.models.Grant.findByPk(id, this.options);
        if (!grant) {
            throw new Error('Grant not found');
        }
        // Only update allowed fields
        const updatableFields = [
            'PlanId',
            'ScheduleId',
            'grantDate',
            'strikePrice',
            'granted',
            'status',
        ];
        updatableFields.forEach((field) => {
            if (data[field] !== undefined) {
                grant[field] = data[field];
            }
        });
        await grant.save(this.options);
        return grant;
    }

    async getMyGrants() {
        return await this.req.db.models.Grant.findAll({
            ...this.options,
            where: {
                UserId: this.req.user.id,
                status: {
                    [Op.ne]: ['draft'],
                },
            },
            include: [
                this.req.db.models.User,
                this.req.db.models.Plan,
                this.req.db.models.Schedule,
                {
                    model: this.req.db.models.Vest,
                    order: [['date', 'ASC']],
                },
            ],
            order: [['createdAt', 'ASC']],
        });
    }

    async rejectGrant(id) {
        const grant = await this.req.db.models.Grant.findByPk(id, this.options);
        if (!grant) {
            throw new Error('Grant not found');
        }

        // Cancel all the associated vests
        await this.req.db.models.Vest.update(
            { status: 'cancelled' },
            {
                where: { GrantId: id },
                ...this.req.options,
            }
        );

        await grant.refreshNumbers(this.options);
        return grant;
    }
}

export default GrantService;
