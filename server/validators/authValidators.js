"use strict";

const validator = require("validator");
const ApiError = require("../utils/ApiError");

const OTP_RE = /^\d{6}$/;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;

/** Trim + lowercase + validate an email address. */
function normalizeEmail(raw) {
  if (typeof raw !== "string") {
    throw ApiError.badRequest("Please enter a valid email address.", "INVALID_EMAIL");
  }
  const email = raw.trim().toLowerCase();
  if (!email || email.length > 254 || !validator.isEmail(email)) {
    throw ApiError.badRequest("Please enter a valid email address.", "INVALID_EMAIL");
  }
  return email;
}

function validateName(raw) {
  if (typeof raw !== "string") {
    throw ApiError.badRequest("Please enter your name.", "INVALID_NAME");
  }
  const name = raw.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 120) {
    throw ApiError.badRequest("Please enter a name between 2 and 120 characters.", "INVALID_NAME");
  }
  return name;
}

/**
 * Password policy: 8–128 chars with at least one lowercase, one uppercase and
 * one number. Strong enough to be meaningful, usable enough for real people.
 */
function validatePassword(raw) {
  if (typeof raw !== "string") {
    throw ApiError.badRequest("Please enter a password.", "WEAK_PASSWORD");
  }
  const password = raw;
  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    throw ApiError.badRequest(
      `Password must be between ${PASSWORD_MIN} and ${PASSWORD_MAX} characters.`,
      "WEAK_PASSWORD"
    );
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    throw ApiError.badRequest(
      "Password must include a lowercase letter, an uppercase letter and a number.",
      "WEAK_PASSWORD"
    );
  }
  return password;
}

function validateOtp(raw) {
  const code = typeof raw === "string" ? raw.trim() : String(raw == null ? "" : raw).trim();
  if (!OTP_RE.test(code)) {
    throw ApiError.badRequest("Please enter the 6-digit code from your email.", "INVALID_OTP");
  }
  return code;
}

module.exports = {
  normalizeEmail,
  validateName,
  validatePassword,
  validateOtp,
  PASSWORD_MIN,
  PASSWORD_MAX
};
