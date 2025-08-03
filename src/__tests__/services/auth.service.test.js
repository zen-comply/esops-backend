import { expect } from 'chai';
import AuthService from '../../services/auth.service.js';

describe('AuthService', () => {
    let authService;
    const testUsername = 'testuser_auth';
    const testPassword = 'testpassword_auth';

    before(() => {
        // You may need to adjust this if your AuthService expects a different req structure
        authService = new AuthService({
            req: global.req, // or provide a mock req with db.models.Account
            options: { tenant_safe: true },
        });
    });

    after(async () => {
        // Cleanup test user if created
        if (authService.req?.db?.models?.Account?.destroy) {
            await authService.req.db.models.Account.destroy({
                where: { username: testUsername },
                force: true,
            });
        }
    });

    it('should create an account with valid username and password', async () => {
        const account = await authService.createAccount({
            username: testUsername,
            password: testPassword,
        });
        expect(account).to.be.an('object');
        expect(account.username).to.equal(testUsername);
        expect(account.password).to.not.equal(testPassword); // Should be hashed
    });

    it('should not allow duplicate usernames', async () => {
        try {
            await authService.createAccount({
                username: testUsername,
                password: 'anotherpassword',
            });
            throw new Error('Duplicate username should throw');
        } catch (err) {
            expect(err).to.exist;
        }
    });

    it('should throw error if username is missing', async () => {
        try {
            await authService.createAccount({ password: testPassword });
            throw new Error('Missing username should throw');
        } catch (err) {
            expect(err).to.exist;
            expect(err.message).to.include(
                'Username and password are required'
            );
        }
    });

    it('should throw error if password is missing', async () => {
        try {
            await authService.createAccount({ username: 'nousername' });
            throw new Error('Missing password should throw');
        } catch (err) {
            expect(err).to.exist;
            expect(err.message).to.include(
                'Username and password are required'
            );
        }
    });

    it('should get account with correct username and password', async () => {
        const account = await authService.getAccount({
            username: testUsername,
            password: testPassword,
        });
        expect(account).to.be.an('object');
        expect(account.username).to.equal(testUsername);
    });

    it('should throw error for invalid password', async () => {
        try {
            await authService.getAccount({
                username: testUsername,
                password: 'wrongpassword',
            });
            throw new Error('Invalid password should throw');
        } catch (err) {
            expect(err).to.exist;
            expect(err.message).to.include('Invalid password');
        }
    });

    it('should throw error for non-existent username', async () => {
        try {
            await authService.getAccount({
                username: 'nonexistentuser',
                password: 'any',
            });
            throw new Error('Non-existent user should throw');
        } catch (err) {
            expect(err).to.exist;
            expect(err.message).to.include('Account not found');
        }
    });
});
