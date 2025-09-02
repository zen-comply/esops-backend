import TenantService from './tenant.service.js';
import { Op } from 'sequelize';

class ScheduleService extends TenantService {
    constructor(req) {
        super(req);
    }

    async createSchedule(data) {
        const scheduleData = {
            title: data.title,
            description: data.description || null,
            cliff: data.cliff,
            periods: data.periods,
        };

        const schedule = await this.req.db.models.Schedule.create(
            scheduleData,
            this.options
        );
        return schedule;
    }

    async getSchedules() {
        return await this.req.db.models.Schedule.findAll({
            ...this.options,
            where: {
                [Op.or]: [
                    { organisationId: null },
                    { organisationId: this.options.tenant_id },
                ],
            },
            order: [['createdAt', 'ASC']],
            tenant_safe: true,
        });
    }

    async updateSchedule(id, data) {
        const schedule = await this.req.db.models.Schedule.findByPk(
            id,
            this.options
        );
        if (!schedule) {
            throw new Error('Schedule not found');
        }

        const updatableFields = ['title', 'description', 'cliff', 'periods'];
        updatableFields.forEach((field) => {
            if (data[field] !== undefined) {
                schedule[field] = data[field];
            }
        });

        await schedule.save(this.options);
        return schedule;
    }

    async deleteSchedule(id) {
        const schedule = await this.req.db.models.Schedule.findByPk(
            id,
            this.options
        );
        if (!schedule) {
            throw new Error('Schedule not found');
        }

        await schedule.destroy(this.options);
        return { message: 'Schedule deleted successfully' };
    }
}

export default ScheduleService;
