import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory for the module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the path to the email templates directory
const templatesDir = path.join(__dirname, 'htmls');

// Helper function to load an HTML file
const loadHtmlFile = (filename) => {
    const filePath = path.join(templatesDir, filename);
    if (!fs.existsSync(filePath)) {
        throw new Error(`HTML file not found: ${filename}`);
    }
    return fs.readFileSync(filePath, 'utf-8');
};

// Define the templates
const templates = {
    EIQWelcomeEmail: {
        TemplateName: 'EIQWelcomeEmail',
        SubjectPart: 'Welcome to EquityiQ!',
        HtmlPart: loadHtmlFile('welcome-email.html'),
        TextPart: 'Welcome {{name}}! We are glad to have you.',
    },
    EIQPasswordSet: {
        TemplateName: 'EIQPasswordSet',
        SubjectPart: 'Set Your Password',
        HtmlPart: loadHtmlFile('password-set.html'),
        TextPart: 'Click this link to set your password: {{resetLink}}',
    },
    EIQForgotPassword: {
        TemplateName: 'EIQForgotPassword',
        SubjectPart: 'Set Your Password',
        HtmlPart: loadHtmlFile('forgot-password.html'),
        TextPart: 'Click this link to set your password: {{resetLink}}',
    },
    EIQNewGrant: {
        TemplateName: 'EIQNewGrant',
        SubjectPart: 'You have a new option grant!',
        HtmlPart: loadHtmlFile('new-grant.html'),
        TextPart:
            'You have been issued a new option grant. Log in to your account to view the details.',
    },
    // Add more templates as needed
};

// Export the templates
export default templates;
