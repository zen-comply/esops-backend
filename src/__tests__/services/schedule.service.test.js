import { expect } from 'chai';
import ScheduleService from '../../services/schedule.service.js';

describe('ScheduleService', () => {
    let req, scheduleService, createdSchedule;

    before(() => {
        // Mock req with db.models.Schedule
        req = {
            policies: [
                {
                    policy: [
                        {
                            action: [
                                'ScheduleService:getSchedules',
                                'ScheduleService:createSchedule',
                                'ScheduleService:updateSchedule',
                                'ScheduleService:deleteSchedule',
                            ],
                        },
                    ],
                },
            ],
            user: {
                id: 1,
                OrganisationId: global.defaultOrg.id,
            },
            options: {
                tenant_id: global.defaultOrg.id,
            },
        };
        scheduleService = new ScheduleService(req);
    });

    it('should create a schedule', async () => {
        const data = {
            title: 'Test Schedule',
            description: 'desc',
            cliff: 12,
            periods: [{ period: 48, percentage: 100, frequency: 1 }],
        };
        createdSchedule = await scheduleService.createSchedule(data);
        expect(createdSchedule).to.have.property('id');
        expect(createdSchedule.title).to.equal('Test Schedule');
    });

    it('should get all schedules', async () => {
        const schedules = await scheduleService.getSchedules();
        expect(schedules).to.be.an('array');
        expect(schedules.length).to.be.greaterThan(0);
    });

    it('should update a schedule', async () => {
        const updated = await scheduleService.updateSchedule(
            createdSchedule.id,
            {
                title: 'Updated Schedule',
            }
        );
        expect(updated).to.have.property('title', 'Updated Schedule');
    });

    it('should throw error if schedule not found for update', async () => {
        try {
            await scheduleService.updateSchedule(999, { title: 'No Schedule' });
            throw new Error('Should have thrown');
        } catch (err) {
            expect(err.message).to.equal('Schedule not found');
        }
    });

    it('should delete a schedule', async () => {
        const result = await scheduleService.deleteSchedule(createdSchedule.id);
        expect(result).to.have.property(
            'message',
            'Schedule deleted successfully'
        );
    });

    it('should throw error if schedule not found for delete', async () => {
        try {
            await scheduleService.deleteSchedule(999);
            throw new Error('Should have thrown');
        } catch (err) {
            expect(err.message).to.equal('Schedule not found');
        }
    });
});
