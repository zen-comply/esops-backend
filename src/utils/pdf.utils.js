import puppeteer from 'puppeteer';
import logger from '../logger.js';

export const generatePdfFromHtml = async (
    html,
    { format = 'A4', printBackground = true } = {}
) => {
    if (!html) {
        throw new Error('HTML content is required to generate PDF.');
    }

    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        return await page.pdf({ format, printBackground });
    } catch (error) {
        logger.error('Failed to generate PDF from HTML', error);
        throw error;
    } finally {
        await browser.close();
    }
};
