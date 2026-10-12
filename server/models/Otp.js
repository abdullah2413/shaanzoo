"use strict";

const mongoose = require("mongoose");

const PURPOSES = {
  SIGNUP_VERIFY: "SIGNUP_VERIFY",
  LOGIN_VERIFY: "LOGIN_VERIFY",
  PASSWORD_RESET: "PASSWORD_RESET",
  DELETE_ACCOUNT: "DELETE_ACCOUNT"
};

/**
 * A one-time passcode record.
 *
 * Security notes:
 * - Only an HMAC hash of the OTP is stored (`otpHash`); the plaintext code
 *   exists only in the email that is sent to the user.
 * - Records expire automatically via a TTL index, but expiry is ALSO enforced
 *   in application code so a code can never be used after its deadline even if
 *   the TTL sweep has not run yet.
 * - `consumed` makes a used code single-use.
 * - `attempts` / `maxAttempts` limit brute-force guessing.
 */
const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    purpose: {
      type: String,
      required: true,
      enum: Object.values(PURPOSES),
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    otpHash: {
      type: String,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true
    },
    attempts: {
      type: Number,
      default: 0
    },
    maxAttempts: {
      type: Number,
      default: 5
    },
    consumed: {
      type: Boolean,
      default: false,
      index: true
    },
    lastSentAt: {
      type: Date,
      default: Date.now
    },
    sendCount: {
      type: Number,
      default: 1
    },
    // Used only for PASSWORD_RESET: a short-lived token issued after the OTP
    // is verified, so the new password can be set in a separate request.
    resetTokenHash: {
      type: String,
      default: null
    },
    resetTokenExpiresAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Keep expired OTPs around briefly (to be able to report "expired") and let
// MongoDB remove them shortly afterwards.
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 30 * 60 });
otpSchema.index({ email: 1, purpose: 1, consumed: 1 });

module.exports = mongoose.model("Otp", otpSchema);
module.exports.PURPOSES = PURPOSES;
