import logger from '../logger.js';
import ScheduleService from '../services/schedule.service.js';

export const getSchedules = async (req, res) => {
    /**
     * #swagger.tags = ['Schedules']
     * #swagger.description = 'Get all schedules'
     */

    /* #swagger.responses[200] = {
    description: 'List of schedules',
    schema: { $ref: '#/definitions/SchedulesResponse' }
    } */

    try {
        const scheduleService = new ScheduleService(req);
        const schedules = await scheduleService.getSchedules();
        res.sendSuccess(schedules);
    } catch (err) {
        logger.error(err);
        res.sendError([err.message], 'Error', 400);
    }
};

export const createSchedule = async (req, res) => {
    /**
     * #swagger.tags = ['Schedules']
     * #swagger.description = 'Create a new schedule'
     * #swagger.parameters['body'] = {
        in: 'body',
        required: true,
        schema: { $ref: '#/definitions/Schedule' }
      }
     * #swagger.responses[200] = {
        description: 'Schedule created successfully',
        schema: { $ref: '#/definitions/ScheduleResponse' }
      }
     */
    try {
        const scheduleService = new ScheduleService(req);
        const schedule = await scheduleService.createSchedule(req.body);
        res.sendSuccess(schedule, 'Schedule created successfully');
    } catch (err) {
        logger.error(err);
        res.sendError([err.message], 'Error', 400);
    }
};

export const updateSchedule = async (req, res) => {
    /**
     * #swagger.tags = ['Schedules']
     * #swagger.description = 'Update a schedule'
     */
    try {
        const scheduleService = new ScheduleService(req);
        const schedule = await scheduleService.updateSchedule(
            req.params.id,
            req.body
        );
        res.sendSuccess(schedule, 'Schedule updated successfully');
    } catch (err) {
        logger.error(err);
        res.sendError([err.message], 'Error', 400);
    }
};

export const deleteSchedule = async (req, res) => {
    /**
     * #swagger.tags = ['Schedules']
     * #swagger.description = 'Delete a schedule'
     */
    try {
        const scheduleService = new ScheduleService(req);
        const result = await scheduleService.deleteSchedule(req.params.id);
        res.sendSuccess(result);
    } catch (err) {
        logger.error(err);
        res.sendError([err.message], 'Error', 400);
    }
};
