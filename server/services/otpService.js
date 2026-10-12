"use strict";

const Otp = require("../models/Otp");
const { PURPOSES } = require("../models/Otp");
const config = require("../config/env");
const ApiError = require("../utils/ApiError");
const { generateOtp, hmacOtp, generateToken, sha256, safeEqual } = require("../utils/security");
const { sendOtpEmail } = require("./emailService");

const ttlMs = () => config.otp.ttlMinutes * 60 * 1000;
const cooldownMs = () => config.otp.resendCooldownSeconds * 1000;

/**
 * Issue a fresh OTP for a given email + purpose.
 *
 * - Enforces a resend cooldown between requests.
 * - Invalidates any previous unconsumed OTP for the same purpose.
 * - Stores only an HMAC hash of the code.
 * - Emails the plaintext code (which is never logged or persisted).
 */
async function issueOtp({ email, purpose, userId = null }) {
  const now = Date.now();

  const recent = await Otp.findOne({ email, purpose }).sort({ createdAt: -1 });
  if (recent && now - new Date(recent.lastSentAt).getTime() < cooldownMs()) {
    const wait = Math.ceil((cooldownMs() - (now - new Date(recent.lastSentAt).getTime())) / 1000);
    throw ApiError.tooMany(
      `Please wait ${wait} more second${wait === 1 ? "" : "s"} before requesting another code.`,
      "OTP_COOLDOWN"
    );
  }

  // Invalidate any still-active codes for this purpose.
  await Otp.updateMany({ email, purpose, consumed: false }, { $set: { consumed: true } });

  const code = generateOtp();
  const doc = await Otp.create({
    email,
    purpose,
    userId,
    otpHash: hmacOtp(code),
    expiresAt: new Date(now + ttlMs()),
    maxAttempts: config.otp.maxAttempts,
    lastSentAt: new Date(now)
  });

  try {
    await sendOtpEmail({
      to: email,
      code,
      purpose,
      expiresMinutes: config.otp.ttlMinutes
    });
  } catch (err) {
    // Delivery failed: remove the record so the user is not blocked by the
    // cooldown and no unusable code lingers.
    await Otp.deleteOne({ _id: doc._id }).catch(() => {});
    throw err;
  }

  return { expiresIn: config.otp.ttlMinutes * 60 };
}

/**
 * Verify an OTP. On success returns the record (not yet consumed) so the
 * caller can perform its purpose-specific follow-up.
 */
async function verifyOtp({ email, purpose, code }) {
  const doc = await Otp.findOne({ email, purpose, consumed: false }).sort({ createdAt: -1 });

  if (!doc) {
    throw ApiError.badRequest(
      "This code is invalid or has expired. Please request a new one.",
      "OTP_INVALID"
    );
  }

  if (new Date(doc.expiresAt).getTime() < Date.now()) {
    doc.consumed = true;
    await doc.save();
    throw ApiError.badRequest("This code has expired. Please request a new one.", "OTP_EXPIRED");
  }

  if (doc.attempts >= doc.maxAttempts) {
    throw ApiError.tooMany(
      "Too many incorrect attempts. Please request a new code.",
      "OTP_ATTEMPTS"
    );
  }

  const matches = safeEqual(hmacOtp(code), doc.otpHash);
  if (!matches) {
    doc.attempts += 1;
    await doc.save();
    const remaining = Math.max(0, doc.maxAttempts - doc.attempts);
    throw ApiError.badRequest(
      remaining > 0
        ? `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
        : "Too many incorrect attempts. Please request a new code.",
      "OTP_MISMATCH"
    );
  }

  return doc;
}

/** Mark an OTP record as used so it can never be replayed. */
async function consumeOtp(doc) {
  doc.consumed = true;
  await doc.save();
}

/**
 * After a PASSWORD_RESET OTP is verified, issue a short-lived single-use reset
 * token. Only its hash is stored.
 */
async function issueResetToken(doc) {
  const token = generateToken(32);
  doc.resetTokenHash = sha256(token);
  doc.resetTokenExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
  doc.consumed = true;
  await doc.save();
  return token;
}

/** Validate and consume a password-reset token, returning its OTP record. */
async function consumeResetToken({ email, token }) {
  const doc = await Otp.findOne({
    email,
    purpose: PURPOSES.PASSWORD_RESET,
    resetTokenHash: sha256(token)
  }).sort({ createdAt: -1 });

  if (!doc || !doc.resetTokenExpiresAt || new Date(doc.resetTokenExpiresAt).getTime() < Date.now()) {
    throw ApiError.badRequest(
      "This reset link is invalid or has expired. Please start again.",
      "RESET_TOKEN_INVALID"
    );
  }

  // Single use: clear the token so it cannot be replayed.
  doc.resetTokenHash = null;
  doc.resetTokenExpiresAt = null;
  await doc.save();
  return doc;
}

module.exports = {
  issueOtp,
  verifyOtp,
  consumeOtp,
  issueResetToken,
  consumeResetToken,
  PURPOSES
};
