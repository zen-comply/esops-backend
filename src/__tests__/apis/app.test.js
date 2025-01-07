import { expect } from 'chai';
import request from 'supertest';

describe('Express app tests', async () => {
    it('Should test if the server is starting fine', async () => {
        const response = await request(global.testServer).get('/');
        expect(response.status).to.equal(200);
        expect(response.body.message).to.equal('Hello, World!');
    })
})