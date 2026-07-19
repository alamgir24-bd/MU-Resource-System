const nodemailer = require("nodemailer");

async function sendEmail({ to, subject, html, text }) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.log("SMTP not configured. Email preview:");
    console.log({ to, subject, text, html });
    return {
      sent: false,
      reason: "SMTP not configured"
    };
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: SMTP_FROM || SMTP_USER,
    to,
    subject,
    text,
    html
  });

  return {
    sent: true
  };
}

module.exports = sendEmail;