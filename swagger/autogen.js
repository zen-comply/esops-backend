import swaggerAutogen from 'swagger-autogen';
import { config } from 'dotenv';
config();

const doc = {
    info: {
        title: 'Equity IQ API docs',
        description: 'APIs for exprees app',
    },
    host: `127.0.0.1:${process.env.PORT}`,
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
        },
    },
    definitions: {
        User: {
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            OrganisationId: 1,
            roles: [{ id: 1, name: 'Admin' }],
            createdAt: '2025-08-11T00:00:00.000Z',
            updatedAt: '2025-08-11T00:00:00.000Z',
        },
        UsersResponse: {
            message: 'Success',
            data: {
                data: [{ $ref: '#/definitions/User' }],
                total: 1,
                page: 1,
                limit: 10,
            },
        },
        UpdateUserResponse: {
            message: 'Success',
            data: { $ref: '#/definitions/User' },
        },
        Schedule: {
            id: 1,
            title: 'Vesting Schedule',
            description: 'Standard 4-year vesting with 1-year cliff',
            cliff: 12,
            periods: 4,
            organisationId: 1,
            createdAt: '2025-08-11T00:00:00.000Z',
            updatedAt: '2025-08-11T00:00:00.000Z',
        },
        SchedulesResponse: {
            message: 'Success',
            data: [{ $ref: '#/definitions/Schedule' }],
        },
        ScheduleResponse: {
            message: 'Success',
            data: { $ref: '#/definitions/Schedule' },
        },
        Grant: {
            id: 1,
            UserId: 1,
            PlanId: 1,
            OrganisationId: 1,
            ScheduleId: 1,
            grantDate: '2022-01-01',
            strikePrice: 10,
            granted: 100,
            status: 'draft',
            createdAt: '2025-08-11T00:00:00.000Z',
            updatedAt: '2025-08-11T00:00:00.000Z',
        },
        GrantsResponse: {
            message: 'Success',
            data: [{ $ref: '#/definitions/Grant' }],
        },
        GrantResponse: {
            message: 'Success',
            data: { $ref: '#/definitions/Grant' },
        },
    },
};

const outputFile = './swagger-output.json';
const routes = ['./src/app.js'];

swaggerAutogen(outputFile, routes, doc);
