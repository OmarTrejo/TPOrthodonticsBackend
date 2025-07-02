const sgMail = require('@sendgrid/mail');
const fs = require('fs');
const path = require('path');
const transporter = require('./emailClient');

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

// Función base para enviar correo con SES
const buildEmailOptions = (to, subject, htmlContent) => ({
  from: `"TPOrthodontics" <${process.env.SES_EMAIL_FROM}>`,
  to,
  subject,
  html: htmlContent,
  attachments: [
    {
      filename: "logo.png",
      content: fs.readFileSync("./utils/email/logo.png").toString("base64"),
      encoding: "base64",
      cid: "logo_image",
    },
  ],
});


const sendWelcomeEmail = async (to, fullname, password, token) => {
  const html = fs.readFileSync(
    path.join(__dirname, "./email/welcomeEmail.html"),
    "utf8"
  );

  const htmlReplaced = replacePlaceholders(html, {
    fullname,
    to,
    password,
    token,
    BASE_URL,
  });

  const mailOptions = buildEmailOptions(
    to,
    "Welcome to TPOrthodontics",
    htmlReplaced
  );

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error("Error sending welcome email:", err);
  }
};

const sendAccessRequestEmail = async (to, fullname) => {
  const html = fs.readFileSync(
    path.join(__dirname, "./email/accessRequestEmail.html"),
    "utf8"
  );

  const htmlReplaced = replacePlaceholders(html, { fullname });

  const mailOptions = buildEmailOptions(
    to,
    "Your platform access request is being processed",
    htmlReplaced
  );

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error("Error sending access request email:", err);
  }
};

const sendAccessRequestDenyEmail = async (to, fullname) => {
  const html = fs.readFileSync(
    path.join(__dirname, "./email/denyAccessRequests.html"),
    "utf8"
  );

  const htmlReplaced = replacePlaceholders(html, { fullname });

  const mailOptions = buildEmailOptions(
    to,
    "Your platform access request has been denied",
    htmlReplaced
  );

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error("Error sending deny email:", err);
  }
};

const sendAccessRequestApprovedEmail = async (to, fullname) => {
  const html = fs.readFileSync(
    path.join(__dirname, "./email/approvedAccessRequests.html"),
    "utf8"
  );

  const htmlReplaced = replacePlaceholders(html, {
    fullname,
    BASE_URL,
  });

  const mailOptions = buildEmailOptions(
    to,
    "Your Access Request Has Been Approved",
    htmlReplaced
  );

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error("Error sending approval email:", err);
  }
};

const sendEmailForgotPassword = async (to, fullname, password, token) => {
  const html = fs.readFileSync(
    path.join(__dirname, "./email/forgotPasswordEmail.html"),
    "utf8"
  );

  const htmlReplaced = replacePlaceholders(html, {
    fullname,
    temp_password: password,
    recovery_token: token,
    BASE_URL,
  });

  const mailOptions = buildEmailOptions(
    to,
    "Password Reset Request - TPRX",
    htmlReplaced
  );

  try {
    const response = await transporter.sendMail(mailOptions);
    console.log("Email sent:", response.messageId);
  } catch (err) {
    console.error("Error sending password reset email:", err);
  }
};


module.exports = {
    sendWelcomeEmail,
    sendAccessRequestEmail,
    sendAccessRequestDenyEmail,
    sendAccessRequestApprovedEmail,
    sendEmailForgotPassword
}