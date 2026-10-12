"use strict";

const fs = require("fs");
const path = require("path");
const config = require("../config/env");
const { escapeHtml } = require("../validators/contactValidators");

/**
 * Reusable mail service.
 *
 * Transport priority (config.mail.transport):
 *   - "resend"  : Resend only
 *   - "smtp"    : SMTP only
 *   - "auto"    : Resend first, fall back to SMTP if it fails
 *   - "preview" : write messages to server/tmp/mail as .html (no external send)
 *
 * Secrets live only in the environment and are never logged or returned.
 */

let resendClient = null;
let smtpTransporter = null;

function getResend() {
  if (resendClient) return resendClient;
  if (!config.mail.resendApiKey) return null;
  // Lazy-require so the dependency is only needed when actually used.
  const { Resend } = require("resend");
  resendClient = new Resend(config.mail.resendApiKey);
  return resendClient;
}

function getSmtp() {
  if (smtpTransporter) return smtpTransporter;
  const s = config.mail.smtp;
  if (!s.host || !s.user || !s.pass) return null;
  const nodemailer = require("nodemailer");
  smtpTransporter = nodemailer.createTransport({
    host: s.host,
    port: s.port,
    secure: s.secure,
    auth: { user: s.user, pass: s.pass }
  });
  return smtpTransporter;
}

function writePreview(message) {
  const dir = path.resolve(config.projectRoot, "server", "tmp", "mail");
  fs.mkdirSync(dir, { recursive: true });
  const safeType = String(message.type || "mail").replace(/[^a-z0-9_-]/gi, "");
  const file = path.join(dir, `${Date.now()}-${safeType}.html`);
  const dump =
    `<!-- PREVIEW ONLY (MAIL_TRANSPORT=preview) -->\n` +
    `<!-- To: ${message.to} -->\n` +
    `<!-- Subject: ${message.subject} -->\n` +
    message.html;
  fs.writeFileSync(file, dump, "utf8");
  console.log(`[mail] Preview message written to server/tmp/mail/${path.basename(file)}`);
}

async function sendViaResend(message) {
  const resend = getResend();
  if (!resend) throw new Error("Resend is not configured.");
  const from = config.mail.resendFrom;
  if (!from) throw new Error("RESEND_FROM_EMAIL is not configured.");
  const result = await resend.emails.send({
    from,
    to: message.to,
    subject: message.subject,
    html: message.html,
    text: message.text
  });
  if (result && result.error) {
    throw new Error(result.error.message || "Resend rejected the message.");
  }
  return true;
}

async function sendViaSmtp(message) {
  const transporter = getSmtp();
  if (!transporter) throw new Error("SMTP is not configured.");
  await transporter.sendMail({
    from: config.mail.smtp.from,
    to: message.to,
    subject: message.subject,
    html: message.html,
    text: message.text
  });
  return true;
}

async function deliver(message) {
  const mode = config.mail.transport;

  if (mode === "preview") {
    writePreview(message);
    return;
  }

  if (mode === "smtp") {
    await sendViaSmtp(message);
    return;
  }

  if (mode === "resend") {
    await sendViaResend(message);
    return;
  }

  // auto: try Resend, fall back to SMTP
  try {
    await sendViaResend(message);
  } catch (err) {
    // Never log secrets; only a short reason.
    console.warn(`[mail] Resend failed (${err.message}); attempting SMTP fallback.`);
    await sendViaSmtp(message);
  }
}

/* ------------------------------ Templates -------------------------------- */

function baseLayout({ preheader, heading, intro, bodyHtml }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0;padding:0;background:#eef3f8;font-family:Segoe UI,Arial,Helvetica,sans-serif;color:#172b3a;">
<div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preheader || "")}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef3f8;padding:24px 12px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #dbe4ec;">
      <tr>
        <td style="background:#073763;padding:20px 28px;">
          <span style="font-size:18px;font-weight:700;color:#ffffff;letter-spacing:.5px;">SHANZOO</span>
        </td>
      </tr>
      <tr>
        <td style="padding:28px;">
          <h1 style="margin:0 0 12px;font-size:20px;color:#073763;">${escapeHtml(heading)}</h1>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#475569;">${escapeHtml(intro)}</p>
          ${bodyHtml}
        </td>
      </tr>
      <tr>
        <td style="padding:18px 28px;background:#f5f8fb;border-top:1px solid #e2e8f0;">
          <p style="margin:0;font-size:12px;line-height:1.6;color:#7b8a97;">
            This is an automated message from SHANZOO. If you did not request it, you can safely ignore this email.
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

const OTP_COPY = {
  SIGNUP_VERIFY: {
    subject: "Your SHANZOO verification code",
    heading: "Verify your email address",
    intro: "Use the code below to finish creating your SHANZOO account."
  },
  LOGIN_VERIFY: {
    subject: "Your SHANZOO sign-in code",
    heading: "Confirm your sign-in",
    intro: "Use the code below to complete your sign-in to SHANZOO."
  },
  PASSWORD_RESET: {
    subject: "Your SHANZOO password reset code",
    heading: "Reset your password",
    intro: "Use the code below to reset the password for your SHANZOO account."
  },
  DELETE_ACCOUNT: {
    subject: "Confirm deletion of your SHANZOO account",
    heading: "Confirm account deletion",
    intro: "Use the code below to confirm that you want to permanently delete your SHANZOO account."
  }
};

function otpBody(code, minutes) {
  const safeCode = escapeHtml(code);
  return `
    <div style="margin:8px 0 18px;padding:16px;background:#f0f6fc;border:1px solid #d6e4f0;border-radius:12px;text-align:center;">
      <div style="font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#5a6b7a;margin-bottom:6px;">Your verification code</div>
      <div style="font-size:34px;font-weight:700;letter-spacing:8px;color:#073763;">${safeCode}</div>
    </div>
    <p style="margin:0 0 12px;font-size:14px;color:#475569;">
      This code expires in <strong>${escapeHtml(String(minutes))} minutes</strong>.
    </p>
    <div style="margin:0;padding:12px 14px;background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;font-size:13px;color:#9a3412;">
      <strong>Security warning:</strong> Never share this code with anyone. SHANZOO staff will never ask you for it.
    </div>`;
}

/**
 * Build + send a transactional OTP email. The plaintext code is only ever
 * placed inside the email body — it is never logged or stored.
 */
async function sendOtpEmail({ to, code, purpose, expiresMinutes }) {
  const copy = OTP_COPY[purpose] || OTP_COPY.SIGNUP_VERIFY;
  const html = baseLayout({
    preheader: `${copy.heading} — code expires in ${expiresMinutes} minutes.`,
    heading: copy.heading,
    intro: copy.intro,
    bodyHtml: otpBody(code, expiresMinutes)
  });
  const text =
    `${copy.heading}\n\nYour SHANZOO verification code is: ${code}\n` +
    `This code expires in ${expiresMinutes} minutes.\n\n` +
    `Never share this code with anyone. SHANZOO staff will never ask you for it.`;

  await deliver({
    type: `otp-${purpose}`,
    to,
    subject: copy.subject,
    html,
    text
  });
}

function row(label, value) {
  return `<tr>
    <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#5a6b7a;white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td>
    <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#172b3a;">${escapeHtml(value) || "&mdash;"}</td>
  </tr>`;
}

/** Build + send a notification email for a contact-form enquiry. */
async function sendContactNotification(inquiry) {
  const html = baseLayout({
    preheader: `New enquiry from ${inquiry.name}`,
    heading: "New website enquiry",
    intro: "A new contact request was submitted through the SHANZOO website.",
    bodyHtml: `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:16px;">
        ${row("Name", inquiry.name)}
        ${row("Email", inquiry.email)}
        ${row("Phone", inquiry.phone)}
        ${row("Company", inquiry.company)}
        ${row("Service", inquiry.service)}
      </table>
      <div style="padding:14px;background:#f5f8fb;border:1px solid #e2e8f0;border-radius:12px;font-size:14px;line-height:1.6;color:#172b3a;white-space:pre-wrap;">${escapeHtml(inquiry.message)}</div>`
  });
  const text =
    `New SHANZOO website enquiry\n\n` +
    `Name: ${inquiry.name}\nEmail: ${inquiry.email}\nPhone: ${inquiry.phone || "-"}\n` +
    `Company: ${inquiry.company || "-"}\nService: ${inquiry.service || "-"}\n\n` +
    `Message:\n${inquiry.message}\n`;

  await deliver({
    type: "contact-inquiry",
    to: config.mail.receiverEmail,
    subject: `New enquiry: ${inquiry.name}`,
    html,
    text
  });
}

module.exports = {
  sendOtpEmail,
  sendContactNotification
};
