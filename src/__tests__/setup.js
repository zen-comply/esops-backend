import app from '../app.js';
import logger from '../logger.js';

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
});

// Close the server after all tests are done
after(() => {
    global.testServer.close();
});
