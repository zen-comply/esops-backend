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
    definitions: {},
};

const outputFile = './swagger-output.json';
const routes = ['./src/app.js'];

swaggerAutogen(outputFile, routes, doc);
