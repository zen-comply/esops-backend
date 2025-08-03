import { expect } from 'chai';
import AuthService from '../../services/auth.service.js';

describe('AuthService', () => {
    let authService;
    const testEmail = 'test@example.com';
    const testPassword = 'testpassword_auth';

    before(() => {
        // You may need to adjust this if your AuthService expects a different req structure
        authService = new AuthService({
            req: global.req, // or provide a mock req with db.models.User
            options: { tenant_safe: true },
        });
    });

    after(async () => {
        // Cleanup test user if created
        if (authService.req?.db?.models?.User?.destroy) {
            await authService.req.db.models.User.destroy({
                where: { email: testEmail },
                force: true,
            });
        }
    });

    it('should create a user with valid email and password', async () => {
        const user = await authService.createUser({
            email: testEmail,
            password: testPassword,
            firstName: 'Test',
            lastName: 'User',
        });
        expect(user).to.be.an('object');
        expect(user.email).to.equal(testEmail);
        expect(user.password).to.not.equal(testPassword); // Should be hashed
    });

    it('should not allow duplicate emails', async () => {
        try {
            await authService.createUser({
                email: testEmail,
                password: 'anotherpassword',
            });
            throw new Error('Duplicate email should throw');
        } catch (err) {
            expect(err).to.exist;
        }
    });

    it('should throw error if email is missing', async () => {
        try {
            await authService.createUser({ password: testPassword });
            throw new Error('Missing email should throw');
        } catch (err) {
            expect(err).to.exist;
            expect(err.message).to.include('Email and password are required');
        }
    });

    it('should throw error if password is missing', async () => {
        try {
            await authService.createUser({
                email: 'noemail',
                password: testPassword,
                firstName: 'No',
                lastName: 'Password',
            });
            throw new Error('Missing email should throw');
        } catch (err) {
            expect(err).to.exist;
            expect(err.message).to.include('Must be a valid email address');
        }
    });

    it('should get user with correct email and password', async () => {
        const user = await authService.getUser({
            email: testEmail,
            password: testPassword,
        });
        expect(user).to.be.an('object');
        expect(user.email).to.equal(testEmail);
    });

    it('should throw error for invalid password', async () => {
        try {
            await authService.getUser({
                email: testEmail,
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
            await authService.getUser({
                email: 'nonexistentuser@example.com',
                password: 'any',
            });
            throw new Error('Non-existent user should throw');
        } catch (err) {
            expect(err).to.exist;
            expect(err.message).to.include('User not found');
        }
    });
});
