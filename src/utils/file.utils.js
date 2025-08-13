import fs from 'fs';
import {
    S3Client,
    DeleteObjectCommand,
    GetObjectCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import path from 'path';
import logger from '../logger.js';
import stream from 'stream';
import handlebars from 'handlebars';
import { format } from 'date-fns';

const client = new S3Client({ region: process.env.AWS_DEFAULT_REGION });

// Handlebars helpers
handlebars.registerHelper('formatDate', function (date, formatString) {
    try {
        return format(new Date(date), formatString);
    } catch (e) {
        logger.error(e);
        return '';
    }
});

handlebars.registerHelper('formatNumber', function (value) {
    const numberValue = Number(value);

    if (isNaN(numberValue)) {
        return '';
    }

    // Use Intl.NumberFormat to format the number with commas
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(numberValue);
});

handlebars.registerHelper('sum', function (a, b) {
    return (Number(a) || 0) + (Number(b) || 0);
});

handlebars.registerHelper('divide', function (value1, value2) {
    if (Number(value2) === 0) {
        throw new Error('Division by zero');
    }
    return Number(value1) / Number(value2);
});

handlebars.registerHelper('multiply', function (value1, value2) {
    return Number(value1) * Number(value2);
});

handlebars.registerHelper('setVar', function (name, value, options) {
    if (!this._variables) this._variables = {}; // Local scope (inside loop)
    if (!options.data.root._variables) options.data.root._variables = {}; // Global scope (@root)

    options.data.root._variables[name] = value; // Store in @root
});

handlebars.registerHelper('getVar', function (name, options) {
    return options.data.root._variables
        ? options.data.root._variables[name]
        : undefined;
});

handlebars.registerHelper('addDays', function (date, days) {
    if (!date) return ''; // Handle undefined/null dates
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + parseInt(days, 10));
    return newDate.toISOString().split('T')[0]; // Returns formatted date (YYYY-MM-DD)
});

handlebars.registerHelper('eq', function (a, b) {
    return a === b;
});

export const uploadFileToS3 = async (
    file,
    bucket,
    key,
    fileSize,
    allowedFileTypes = [],
    isPublic = false
) => {
    if (!file) {
        throw new Error('File is required');
    }
    if (allowedFileTypes.length === 0)
        allowedFileTypes = process.env.ALLOWED_FILE_TYPES || ['txt', 'html'];
    if (fileSize === undefined || null)
        fileSize = process.env.MAX_FILE_SIZE || 10;

    const body = new stream.Readable({
        read() {
            this.push(file.buffer);
            this.push(null);
        },
    });

    //In bytes
    const maxFileSize = fileSize * 1024 * 1024;
    const fileExt = path.extname(file.originalname).toLowerCase().substring(1);

    if (!allowedFileTypes.includes(fileExt)) {
        throw new Error(`File type ${fileExt} is not allowed.`);
    }

    // Check file size
    if (file.size >= maxFileSize) {
        throw new Error(
            `File ${file.originalname} exceeds the maximum file size of ${fileSize}MB.`
        );
    }

    const params = {
        Bucket: bucket,
        Key: key,
        Body: body,
        ACL: isPublic ? 'public-read' : undefined,
    };

    const upload = new Upload({
        client: client,
        params: params,
    });

    try {
        const response = await upload.done();
        return response;
    } catch (err) {
        logger.error(err);
        return null;
    }
};

export const deleteFileFromS3 = async (bucket, key) => {
    const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
    });

    try {
        const response = await client.send(command);
        return response;
    } catch (err) {
        logger.error(err);
        return null;
    }
};

export const fillHtmlTemplate = (template, data) => {
    const compiledTemplate = handlebars.compile(template);
    return compiledTemplate(data);
};

/**
 * Convert a Readable Stream to a String
 * @param {Readable} stream
 * @returns {Promise<string>}
 */
const streamToString = (stream) =>
    new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () =>
            resolve(Buffer.concat(chunks).toString('utf-8'))
        );
    });

export const fillHtmlTemplateFromFile = async (file, data) => {
    try {
        const { s3Key, s3Bucket } = file;

        // Fetch the template from S3
        const command = new GetObjectCommand({ Bucket: s3Bucket, Key: s3Key });
        const s3Object = await client.send(command);

        // Convert stream to string
        const template = await streamToString(s3Object.Body);

        // Compile and fill the template
        return fillHtmlTemplate(
            template,
            typeof data?.toJSON === 'function' ? data.toJSON() : data
        );
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

export async function readFile(filePath) {
    try {
        const data = fs.readFileSync(filePath);
        return data;
    } catch (error) {
        throw new Error(error.message);
    }
}

export function createFileObject(buffer, fileName, mimeType, size = 1) {
    const fileObject = {
        buffer: buffer,
        filename: Date.now() + '-' + fileName,
        originalname: fileName,
        mimetype: mimeType,
        size: size,
    };
    return fileObject;
}

export const streamToBuffer = async (stream) => {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
};

export function downloadFileFromS3(s3Key, s3Bucket) {
    const command = new GetObjectCommand({ Bucket: s3Bucket, Key: s3Key });
    return client.send(command);
}

export const generateCSV = async ({ data, fileName = 'export.csv' }) => {
    if (!data || data.length === 0) {
        throw new Error('No data to export');
    }

    // Extract headers
    const headers = Object.keys(data[0]);

    // Escape and quote headers
    const quotedHeaders = headers.map(
        (header) => `"${header.replace(/"/g, '""')}"`
    );

    // Map rows and escape values
    const csvData = data.map((row) =>
        headers
            .map((header) => {
                const value = row[header] ?? '';
                const stringValue =
                    typeof value === 'string' ? value : String(value);
                return `"${stringValue.replace(/"/g, '""')}"`; // Quote & escape
            })
            .join(',')
    );

    const csvContent = [quotedHeaders.join(','), ...csvData].join('\n');

    // Convert to Buffer
    const buffer = Buffer.from('\uFEFF' + csvContent, 'utf-8');

    // Return file object
    return {
        buffer,
        originalname: fileName,
        size: buffer.length,
    };
};
