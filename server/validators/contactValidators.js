"use strict";

const validator = require("validator");
const ApiError = require("../utils/ApiError");

const MESSAGE_MAX = 1500;

/** Escape untrusted values for safe interpolation into HTML email bodies. */
function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Strip CR/LF (and other control characters) from header-bound values to stop
 * email header injection.
 */
function stripControl(value) {
  // eslint-disable-next-line no-control-regex
  return String(value == null ? "" : value).replace(/[\u0000-\u001F\u007F]+/g, " ").trim();
}

function cleanText(raw, { field, required, max }) {
  if (raw === undefined || raw === null) raw = "";
  if (typeof raw !== "string") raw = String(raw);
  const value = stripControl(raw);
  if (required && !value) {
    throw ApiError.badRequest(`Please provide ${field}.`, "INVALID_FIELD");
  }
  if (value.length > max) {
    throw ApiError.badRequest(`${field} is too long (maximum ${max} characters).`, "INVALID_FIELD");
  }
  return value;
}

/** Validate and normalise a contact-form submission. */
function validateContact(body) {
  const name = cleanText(body.name, { field: "your name", required: true, max: 120 });

  const emailRaw = cleanText(body.email, { field: "your email", required: true, max: 254 }).toLowerCase();
  if (!validator.isEmail(emailRaw)) {
    throw ApiError.badRequest("Please enter a valid email address.", "INVALID_EMAIL");
  }

  const phone = cleanText(body.phone, { field: "phone number", required: false, max: 32 });
  if (phone && !/^[+\d][\d\s().-]{5,}$/.test(phone)) {
    throw ApiError.badRequest("Please enter a valid phone number.", "INVALID_PHONE");
  }

  const company = cleanText(body.company, { field: "company name", required: false, max: 120 });
  const service = cleanText(body.service, { field: "service", required: false, max: 160 });
  const message = cleanText(body.message, { field: "a message", required: true, max: MESSAGE_MAX });

  const consent = body.consent === true || body.consent === "true" || body.consent === "on";
  if (!consent) {
    throw ApiError.badRequest("Please accept the consent statement to continue.", "CONSENT_REQUIRED");
  }

  return { name, email: emailRaw, phone, company, service, message };
}

module.exports = { validateContact, escapeHtml, stripControl };
