import winston from 'winston';

const { combine, timestamp, printf, colorize } = winston.format;

// Define a custom log format
const logFormat = printf(({ level, message, timestamp }) => {
    return `[${timestamp}] ${level}: ${message}`;
});

// Create the Winston logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        colorize(), // Add colors to log levels
        logFormat
    ),
    transports: [
        new winston.transports.Console(), // Log to the console
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
        }), // Log errors to file
        new winston.transports.File({ filename: 'logs/combined.log' }), // Log all messages to file
    ],
});

// Export the logger
export default logger;
