const nodemailer = require('nodemailer');

console.log('SMTP_USER:', process.env.SES_AWS_SMTP_USER);
console.log('SMTP_PASSWORD:', process.env.SES_AWS_SMTP_PASSWORD);

const transporter = nodemailer.createTransport({
  host: "email-smtp.us-east-1.amazonaws.com", // cambia según tu región
  port: 465,
  secure: true,
  auth: {
    user: process.env.SES_AWS_SMTP_USER,
    pass: process.env.SES_AWS_SMTP_PASSWORD,
  },
});

module.exports = transporter;