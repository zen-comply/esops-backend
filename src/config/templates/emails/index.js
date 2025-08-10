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
    WelcomeEmail: {
        TemplateName: 'WelcomeEmail',
        SubjectPart: 'Welcome to EquityiQ!',
        HtmlPart: loadHtmlFile('welcome-email.html'),
        TextPart: 'Welcome {{name}}! We are glad to have you.',
    },
    PasswordSet: {
        TemplateName: 'PasswordSet',
        SubjectPart: 'Set Your Password',
        HtmlPart: loadHtmlFile('password-set.html'),
        TextPart: 'Click this link to set your password: {{resetLink}}',
    },
    ForgotPassword: {
        TemplateName: 'ForgotPassword',
        SubjectPart: 'Set Your Password',
        HtmlPart: loadHtmlFile('forgot-password.html'),
        TextPart: 'Click this link to set your password: {{resetLink}}',
    },
};

// Export the templates
export default templates;
