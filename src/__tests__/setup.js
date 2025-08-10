import app from '../app.js';
import logger from '../logger.js';
import request from 'supertest';
import sample from './data/sample.js';
import db from '../config/database.js';

const TEST_PORT = 3001;

// Function to start the server
const startServer = () => {
    return new Promise((resolve, reject) => {
        const server = app.listen(TEST_PORT, () => {
            logger.info(
                `Test server is running on http://localhost:${TEST_PORT}`
            );
            resolve(server);
        });
        server.on('error', (err) => {
            reject(err);
        });
    });
};

// Start the server before running tests
before(async () => {
    global.testServer = await startServer();

    // login as super user
    const response = await login(
        process.env.SUPER_ADMIN_EMAIL,
        process.env.SUPER_ADMIN_PASSWORD
    );
    global.superUserToken = response.body.data.accessToken;

    // Create an organisation
    const orgResopnse = await createOrganisation(
        sample.organisation.name,
        sample.organisation.admin
    );
    global.defaultOrg = orgResopnse.body.data;
    global.defaultOrg.admin = await db.models.User.findOne({
        where: { email: sample.organisation.admin.email },
        tenant_safe: true,
    });
    logger.info('Default org created');

    // Login with admin user
    const adminResponse = await login(
        sample.organisation.admin.email,
        sample.organisation.admin.password
    );
    global.defaultOrg.adminToken = adminResponse.body.data.accessToken;
});

// Close the server after all tests are done
after(async () => {
    await db.models.Organisation.destroy({
        where: { name: sample.organisation.name },
        force: true,
    });
    await db.models.User.destroy({
        where: { email: sample.organisation.admin.email },
        force: true,
    });

    global.testServer.close();
});

export const login = async (email, password) => {
    const response = await request(global.testServer).post('/auth/login').send({
        email,
        password,
    });
    return response;
};

export const createOrganisation = async (name, admin) => {
    const response = await request(global.testServer)
        .post('/organisations')
        .set('Authorization', `Bearer ${global.superUserToken}`)
        .send({
            name,
            ...admin,
        });
    return response;
};
