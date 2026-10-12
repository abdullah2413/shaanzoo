"use strict";

const mongoose = require("mongoose");

/**
 * A contact / "request a consultation" enquiry submitted from the website.
 * Stored for reference; a copy is emailed to CONTACT_RECEIVER_EMAIL.
 */
const contactInquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    phone: { type: String, trim: true, maxlength: 32, default: "" },
    company: { type: String, trim: true, maxlength: 120, default: "" },
    service: { type: String, trim: true, maxlength: 160, default: "" },
    message: { type: String, required: true, trim: true, maxlength: 1500 },
    ip: { type: String, default: "", maxlength: 100 },
    userAgent: { type: String, default: "", maxlength: 400 }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

module.exports = mongoose.model("ContactInquiry", contactInquirySchema);
