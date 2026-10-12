"use strict";

const ContactInquiry = require("../models/ContactInquiry");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/response");
const { validateContact } = require("../validators/contactValidators");
const { sendContactNotification } = require("../services/emailService");

const createContact = asyncHandler(async (req, res) => {
  const clean = validateContact(req.body || {});

  const inquiry = await ContactInquiry.create({
    ...clean,
    ip: (req.ip || "").slice(0, 100),
    userAgent: (req.get("user-agent") || "").slice(0, 400)
  });

  // Deliver the notification. Failures are logged server-side but never
  // surfaced to the visitor (no internal mail/credentials details leak).
  try {
    await sendContactNotification(clean);
  } catch (err) {
    console.error(`[contact] Failed to email inquiry ${inquiry._id}: ${err.message}`);
  }

  return sendSuccess(
    res,
    { message: "Thank you. Your message has been received — our team will reply by email shortly." },
    201
  );
});

module.exports = { createContact };
