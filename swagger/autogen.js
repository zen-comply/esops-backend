import swaggerAutogen from 'swagger-autogen';
import { config } from 'dotenv';
config();

const doc = {
    info: {
        title: 'API documentation',
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
    },
};

const outputFile = './swagger-output.json';
const routes = ['./src/app.js'];

swaggerAutogen(outputFile, routes, doc);
