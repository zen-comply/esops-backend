import jwt from 'jsonwebtoken';
import crypto from 'crypto'; // Import crypto module
import logger from '../logger.js';

const IV_LENGTH = 16;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be a 32-byte string.');
}

export const generateToken = async (data, expiry = '24h') => {
    return jwt.sign(data, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: expiry,
    });
};

export const generateSystemUserData = () => {
    return {
        firstName: `sys_${crypto.randomUUID().slice(0, 8)}`,
        lastName: `user_${crypto.randomUUID().slice(0, 8)}`,
    };
};

export const encrypt = (text) => {
    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);

        const encrypted = Buffer.concat([
            cipher.update(text, 'utf8'),
            cipher.final(),
        ]);

        const authTag = cipher.getAuthTag();

        const result = Buffer.concat([iv, authTag, encrypted]).toString(
            'base64'
        );
        return result;
    } catch (error) {
        logger.error('Encryption failed:', error);
        throw new Error('Failed to encrypt data.');
    }
};

export const decrypt = (encryptedData) => {
    try {
        const data = Buffer.from(encryptedData, 'base64');
        const iv = data.slice(0, IV_LENGTH);
        const authTag = data.slice(IV_LENGTH, IV_LENGTH + 16);
        const encrypted = data.slice(IV_LENGTH + 16);

        const decipher = crypto.createDecipheriv(
            'aes-256-gcm',
            ENCRYPTION_KEY,
            iv
        );
        decipher.setAuthTag(authTag);

        const decrypted = Buffer.concat([
            decipher.update(encrypted),
            decipher.final(),
        ]);

        return decrypted.toString('utf8');
    } catch (error) {
        logger.error('Decryption failed:', error);
        throw new Error('Failed to decrypt data.');
    }
};
