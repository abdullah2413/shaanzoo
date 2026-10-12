"use strict";

const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const config = require("../config/env");

const BCRYPT_ROUNDS = config.isProd ? 12 : 10;

/* ------------------------------ Passwords -------------------------------- */

async function hashPassword(plain) {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

async function verifyPassword(plain, hash) {
  if (!hash) return false;
  return bcrypt.compare(plain, hash);
}

/**
 * Compare against a throwaway hash to equalise timing when a user does not
 * exist, mitigating user-enumeration through response timing.
 */
const DUMMY_HASH = "$2a$10$CwTycUXWue0Thq9StjUM0uJ8D0yVd3P0Q8K0k0o9j0mQ1j8vY6m0u";
async function fakeVerifyPassword(plain) {
  try {
    await bcrypt.compare(plain, DUMMY_HASH);
  } catch (_e) {
    /* ignore */
  }
  return false;
}

/* ------------------------------ OTP & tokens ----------------------------- */

/**
 * Generate a cryptographically secure 6-digit numeric OTP.
 * Uses crypto.randomInt (NOT Math.random). Codes may start with 0.
 */
function generateOtp() {
  const n = crypto.randomInt(0, 1000000);
  return String(n).padStart(6, "0");
}

/** Generate a cryptographically secure opaque token (hex). */
function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

/** Plain SHA-256 hash (for single-use, high-entropy tokens). */
function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

/**
 * Keyed HMAC-SHA256 used for OTP hashing. The OTP_PEPPER secret means a leaked
 * database alone is not enough to verify a guessed code hash.
 */
function hmacOtp(otp) {
  return crypto
    .createHmac("sha256", config.secrets.otpPepper)
    .update(String(otp))
    .digest("hex");
}

/** Constant-time string comparison that never throws on length mismatch. */
function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

module.exports = {
  hashPassword,
  verifyPassword,
  fakeVerifyPassword,
  generateOtp,
  generateToken,
  sha256,
  hmacOtp,
  safeEqual
};
