const sgMail = require('@sendgrid/mail');
const fs = require('fs');
const path = require('path');

// Init SENDGRID
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
// Create baseURL
const BASE_URL = process.env.BASE_URL;

// Función para realizar múltiples reemplazos
const replacePlaceholders = (html, replacements) => {
    let result = html;
    for (const [key, value] of Object.entries(replacements)) {
        const regex = new RegExp(`{{${key}}}`, 'g'); // Crea un regex dinámico para cada placeholder
        result = result.replace(regex, value);
    }
    return result;
};

// SEND Welcome email
const sendWelcomeEmail = async (to, fullname, password) => {
    

    // Leer el archivo HTML
    const htmlContent = fs.readFileSync(path.join(__dirname, './email/welcomeEmail.html'), 'utf8');

    // Crear un objeto con los valores que deseas reemplazar
    const replacements = {
        fullname,
        to,
        password,
        BASE_URL
    };

    // Reemplazar todas las variables en el HTML
    const personalizedHtml = replacePlaceholders(htmlContent, replacements);

    const msg = {
        to,
        from: process.env.SENDGRID_EMAIL,
        subject: "Welcome to TPOrthodontics",
        html: personalizedHtml,
        attachments: [
            {
                filename: 'logo.png',
                content: fs.readFileSync('./utils/email/logo.png').toString('base64'),
                type: 'image/png',
                disposition: 'inline',
                content_id: 'logo_image'
            }
        ]
    };

    try {
        await sgMail.send(msg);
    } catch (error) {
        logger.error('Error to update logs, Please try again later.');
    }
};

// Send email to wait authorization
const sendAccessRequestEmail = async (to, fullname) => {
    // Leer el archivo HTML
    const htmlContent = fs.readFileSync(path.join(__dirname, './email/accessRequestEmail.html'), 'utf8');

    // Crear un objeto con los valores que deseas reemplazar
    const replacements = {
        fullname
    };

    // Reemplazar todas las variables en el HTML
    const personalizedHtml = replacePlaceholders(htmlContent, replacements);

    const msg = {
        to,
        from: process.env.SENDGRID_EMAIL,
        subject: "Your platform access request is being processed",
        html: personalizedHtml,
        attachments: [
            {
                filename: 'logo.png',
                content: fs.readFileSync('./utils/email/logo.png').toString('base64'),
                type: 'image/png',
                disposition: 'inline',
                content_id: 'logo_image'
            }
        ]
    };

    try {
        await sgMail.send(msg);
    } catch (error) {
        logger.error('Error to update logs, Please try again later.');
    }
};

// Send email to wait authorization
const sendAccessRequestDenyEmail = async (to, fullname) => {
    // Leer el archivo HTML
    const htmlContent = fs.readFileSync(path.join(__dirname, './email/denyAccessRequests.html'), 'utf8');

    // Crear un objeto con los valores que deseas reemplazar
    const replacements = {
        fullname
    };

    // Reemplazar todas las variables en el HTML
    const personalizedHtml = replacePlaceholders(htmlContent, replacements);

    const msg = {
        to,
        from: process.env.SENDGRID_EMAIL,
        subject: "Your platform access request has been denied",
        html: personalizedHtml,
        attachments: [
            {
                filename: 'logo.png',
                content: fs.readFileSync('./utils/email/logo.png').toString('base64'),
                type: 'image/png',
                disposition: 'inline',
                content_id: 'logo_image'
            }
        ]
    };

    try {
        await sgMail.send(msg);
    } catch (error) {
        logger.error('Error to update logs, Please try again later.');
    }
};

// SEND Welcome email
const sendAccessRequestApprovedEmail = async (to, fullname) => {

    // Leer el archivo HTML
    const htmlContent = fs.readFileSync(path.join(__dirname, './email/approvedAccessRequests.html'), 'utf8');

    // Crear un objeto con los valores que deseas reemplazar
    const replacements = {
        fullname,
        BASE_URL
    };

    // Reemplazar todas las variables en el HTML
    const personalizedHtml = replacePlaceholders(htmlContent, replacements);

    const msg = {
        to,
        from: process.env.SENDGRID_EMAIL,
        subject: "Your Access Request Has Been Approved",
        html: personalizedHtml,
        attachments: [
            {
                filename: 'logo.png',
                content: fs.readFileSync('./utils/email/logo.png').toString('base64'),
                type: 'image/png',
                disposition: 'inline',
                content_id: 'logo_image'
            }
        ]
    };

    try {
        await sgMail.send(msg);
    } catch (error) {
        logger.error('Error to update logs, Please try again later.');
    }
};

/**
 * TODO Send email to recovery password
 * @param {*} to 
 * @param {*} fullname 
 */
const sendEmailForgotPassword = async(to, fullname, password, token) => {
    // Leer el archivo HTML
    const htmlContent = fs.readFileSync(path.join(__dirname, './email/forgotPasswordEmail.html'), 'utf8');
    
    // Crear un objeto con los valores que deseas reemplazar
    const replacements = {
        fullname,
        temp_password: password,
        recovery_token: token,
        BASE_URL
    };
    
    // Reemplazar todas las variables en el HTML
    const personalizedHtml = replacePlaceholders(htmlContent, replacements);
    
    const msg = {
        to,
        from: process.env.SENDGRID_EMAIL,
        subject: "Password Reset Request - TPRX",
        html: personalizedHtml,
        attachments: [
            {
                filename: 'logo.png',
                content: fs.readFileSync('./utils/email/logo.png').toString('base64'),
                type: 'image/png',
                disposition: 'inline',
                content_id: 'logo_image'
            }
        ]
    };
    
    try {
        await sgMail.send(msg);
    } catch (error) {
        logger.error('Error to update logs, Please try again later.');
    }
    }

module.exports = {
    sendWelcomeEmail,
    sendAccessRequestEmail,
    sendAccessRequestDenyEmail,
    sendAccessRequestApprovedEmail,
    sendEmailForgotPassword
}