import TenantService from './tenant.service.js';
import { Op } from 'sequelize';
class GrantService extends TenantService {
    constructor(req) {
        super(req);
    }

    async _attachFileUrls(grants) {
        if (!grants) return grants;
        const items = Array.isArray(grants) ? grants : [grants];

        for (const grant of items) {
            const files = grant?.Files || grant?.File || [];
            if (!Array.isArray(files)) continue;
            await Promise.all(
                files.map(async (file) => {
                    if (file && typeof file.getUrl === 'function') {
                        const url = await file.getUrl();
                        file.url = url;
                        file.setDataValue('url', url || null);
                    }
                })
            );
        }

        return grants;
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
        const grants = await this.req.db.models.Grant.findAll({
            ...this.options,
            order: [['createdAt', 'ASC']],
            include: [
                this.req.db.models.User,
                this.req.db.models.Plan,
                this.req.db.models.Schedule,
                {
                    model: this.req.db.models.File,
                    required: false,
                },
                {
                    model: this.req.db.models.Vest,
                    order: [['date', 'ASC']],
                },
            ],
        });
        return await this._attachFileUrls(grants);
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
                {
                    model: this.req.db.models.File,
                    required: false,
                },
                this.req.db.models.Vest,
            ],
        });
        if (!grant) {
            throw new Error('Grant not found');
        }
        return await this._attachFileUrls(grant);
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
        const grants = await this.req.db.models.Grant.findAll({
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
                    model: this.req.db.models.File,
                    required: false,
                },
                {
                    model: this.req.db.models.Vest,
                    order: [['date', 'ASC']],
                },
            ],
            order: [['createdAt', 'ASC']],
        });
        return await this._attachFileUrls(grants);
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
