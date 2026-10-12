"use strict";

const mongoose = require("mongoose");

/**
 * Application user.
 * Only the minimum required fields are stored; the password is always kept as
 * a bcrypt hash and is excluded from queries by default (`select: false`).
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      maxlength: 254
    },
    passwordHash: {
      type: String,
      required: true,
      select: false
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

/**
 * Return only the safe, public representation of a user.
 * Never expose passwordHash, OTP data, sessions or internal metadata.
 */
userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    isEmailVerified: this.isEmailVerified,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model("User", userSchema);
