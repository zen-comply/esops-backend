/**
 * This file contains utility functions for rest ful apis.
 */

import logger from '../logger.js';

/**
 * This function is a middleware to format the response of the api.
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
export const responseFormatter = (req, res, next) => {
    res.sendSuccess = (data, message = 'Success', statusCode = 200) => {
        if (!res.headersSent) {
            res.status(statusCode).json({
                status: 'success',
                message,
                data,
            });
        }
    };

    res.sendError = (errors, message = 'Error', statusCode = 500) => {
        if (!res.headersSent) {
            res.status(statusCode).json({
                status: 'error',
                message,
                errors,
            });
        }
    };

    next();
};

export const logRequest = (req, res, next) => {
    logger.info(`Http request`, {
        method: req.method,
        url: req.url,
        body: filterPII(req.body),
        query: filterPII(req.query),
        params: filterPII(req.params),
        headers: req.headers,
    });
    next();
};

const filterPII = (obj) => {
    let filteredObj = { ...obj };
    const piiKeys = ['password', 'email', 'phone', 'address'];
    for (let key of piiKeys) {
        if (obj[key]) filteredObj[key] = '***';
    }
    return filteredObj;
};
