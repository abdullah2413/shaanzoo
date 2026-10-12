"use strict";

const mongoose = require("mongoose");

/**
 * A server-side authenticated session (one per browser/login).
 *
 * - `tokenHash` is the SHA-256 hash of the raw session token that lives in the
 *   user's httpOnly cookie. The raw token is never stored, so a database leak
 *   cannot be replayed.
 * - `csrfHash` is the hash of the CSRF token used for the double-submit-cookie
 *   protection on state-changing requests.
 * - `expiresAt` is a TTL index, so expired sessions vanish automatically.
 *   Expiry is also enforced in application code.
 */
const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    csrfHash: {
      type: String,
      required: true
    },
    userAgent: {
      type: String,
      default: "",
      maxlength: 400
    },
    ip: {
      type: String,
      default: "",
      maxlength: 100
    },
    lastSeenAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Session", sessionSchema);
