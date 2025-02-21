const sgMail = require('@sendgrid/mail');
const fs = require('fs');
const path = require('path');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// SEND EMAILS
const sendEmail = async (to, username, password) => {
    base_url = process.env.BASE_URL;

    // Leer el archivo HTML
    const htmlContent = fs.readFileSync(path.join(__dirname, './email/welcomeEmail.html'), 'utf8');

    // Crear un objeto con los valores que deseas reemplazar
    const replacements = {
        username,
        password,
        base_url
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

// Función para realizar múltiples reemplazos
const replacePlaceholders = (html, replacements) => {
    let result = html;
    for (const [key, value] of Object.entries(replacements)) {
        const regex = new RegExp(`{{${key}}}`, 'g'); // Crea un regex dinámico para cada placeholder
        result = result.replace(regex, value);
    }
    return result;
};

module.exports = {
    sendEmail
}