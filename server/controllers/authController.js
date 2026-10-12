"use strict";

const User = require("../models/User");
const Otp = require("../models/Otp");
const { PURPOSES } = require("../models/Otp");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/response");
const { hashPassword, verifyPassword, fakeVerifyPassword } = require("../utils/security");
const {
  normalizeEmail,
  validateName,
  validatePassword,
  validateOtp
} = require("../validators/authValidators");
const otpService = require("../services/otpService");
const sessionService = require("../services/sessionService");

const OTP_GENERIC =
  "If an account exists for this email, a verification code has been sent.";

/* ------------------------------- Sign up --------------------------------- */

const signup = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const name = validateName(body.name);
  const email = normalizeEmail(body.email);
  const password = validatePassword(body.password);

  const existing = await User.findOne({ email });

  if (existing && existing.isEmailVerified) {
    throw ApiError.conflict(
      "An account with this email already exists. Please sign in instead.",
      "EMAIL_IN_USE"
    );
  }

  const passwordHash = await hashPassword(password);

  let user;
  if (existing) {
    // Unverified account: refresh its details and re-issue a code.
    existing.name = name;
    existing.passwordHash = passwordHash;
    existing.isEmailVerified = false;
    user = await existing.save();
  } else {
    user = await User.create({ name, email, passwordHash, isEmailVerified: false });
  }

  let expiresIn;
  try {
    ({ expiresIn } = await otpService.issueOtp({
      email,
      purpose: PURPOSES.SIGNUP_VERIFY,
      userId: user._id
    }));
  } catch (err) {
    // If a code was already sent moments ago, the earlier code is still valid.
    if (err && err.code !== "OTP_COOLDOWN") throw err;
    expiresIn = 120;
  }

  return sendSuccess(
    res,
    { email, purpose: PURPOSES.SIGNUP_VERIFY, requiresOtp: true, expiresIn },
    201
  );
});

const verifySignupOtp = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const email = normalizeEmail(body.email);
  const code = validateOtp(body.otp ?? body.code);

  const user = await User.findOne({ email });
  if (!user) {
    throw ApiError.badRequest(
      "This code is invalid or has expired. Please request a new one.",
      "OTP_INVALID"
    );
  }

  const doc = await otpService.verifyOtp({ email, purpose: PURPOSES.SIGNUP_VERIFY, code });
  await otpService.consumeOtp(doc);

  user.isEmailVerified = true;
  await user.save();

  const { csrfToken } = await sessionService.createSession(user, req, res);

  return sendSuccess(res, { user: user.toPublicJSON(), csrfToken });
});

/* -------------------------------- Sign in -------------------------------- */

const login = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const email = normalizeEmail(body.email);
  const password = typeof body.password === "string" ? body.password : "";

  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user) {
    await fakeVerifyPassword(password);
    throw ApiError.unauthorized("Invalid email or password.", "INVALID_CREDENTIALS");
  }

  const matches = await verifyPassword(password, user.passwordHash);
  if (!matches) {
    throw ApiError.unauthorized("Invalid email or password.", "INVALID_CREDENTIALS");
  }

  if (!user.isEmailVerified) {
    // Password is correct but the email is not verified: send a fresh signup
    // code and tell the client to complete verification.
    let expiresIn = 120;
    try {
      ({ expiresIn } = await otpService.issueOtp({
        email,
        purpose: PURPOSES.SIGNUP_VERIFY,
        userId: user._id
      }));
    } catch (err) {
      if (err && err.code !== "OTP_COOLDOWN") throw err;
    }
    return sendSuccess(res, {
      email,
      stage: "verify_signup",
      purpose: PURPOSES.SIGNUP_VERIFY,
      requiresOtp: true,
      expiresIn
    });
  }

  let expiresIn;
  try {
    ({ expiresIn } = await otpService.issueOtp({
      email,
      purpose: PURPOSES.LOGIN_VERIFY,
      userId: user._id
    }));
  } catch (err) {
    if (err && err.code !== "OTP_COOLDOWN") throw err;
    expiresIn = 120;
  }

  return sendSuccess(res, {
    email,
    stage: "verify_login",
    purpose: PURPOSES.LOGIN_VERIFY,
    requiresOtp: true,
    expiresIn
  });
});

const verifyLoginOtp = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const email = normalizeEmail(body.email);
  const code = validateOtp(body.otp ?? body.code);

  const user = await User.findOne({ email });
  if (!user || !user.isEmailVerified) {
    throw ApiError.badRequest(
      "This code is invalid or has expired. Please request a new one.",
      "OTP_INVALID"
    );
  }

  const doc = await otpService.verifyOtp({ email, purpose: PURPOSES.LOGIN_VERIFY, code });
  await otpService.consumeOtp(doc);

  const { csrfToken } = await sessionService.createSession(user, req, res);

  return sendSuccess(res, { user: user.toPublicJSON(), csrfToken });
});

/* ------------------------------ Resend OTP ------------------------------- */

const resendOtp = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const email = normalizeEmail(body.email);
  const purpose = body.purpose;

  const allowed = [PURPOSES.SIGNUP_VERIFY, PURPOSES.LOGIN_VERIFY, PURPOSES.PASSWORD_RESET];
  if (!allowed.includes(purpose)) {
    throw ApiError.badRequest("Unknown verification purpose.", "BAD_PURPOSE");
  }

  const expiresIn = 120;

  // Always respond with a generic message to avoid revealing whether an
  // account exists. A new code is only actually generated when appropriate,
  // and cooldown issues are swallowed (the previous code remains valid).
  const user = await User.findOne({ email });
  if (user) {
    const appropriate =
      (purpose === PURPOSES.SIGNUP_VERIFY && !user.isEmailVerified) ||
      (purpose === PURPOSES.LOGIN_VERIFY && user.isEmailVerified) ||
      purpose === PURPOSES.PASSWORD_RESET;
    if (appropriate) {
      try {
        await otpService.issueOtp({ email, purpose, userId: user._id });
      } catch (err) {
        if (err && err.code !== "OTP_COOLDOWN") throw err;
      }
    }
  }

  return sendSuccess(res, { email, purpose, expiresIn, message: OTP_GENERIC });
});

/* ----------------------------- Forgot password --------------------------- */

const forgotPassword = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const email = normalizeEmail(body.email);

  const user = await User.findOne({ email });
  if (user) {
    try {
      await otpService.issueOtp({
        email,
        purpose: PURPOSES.PASSWORD_RESET,
        userId: user._id
      });
    } catch (err) {
      if (err && err.code !== "OTP_COOLDOWN") throw err;
    }
  }

  return sendSuccess(res, { email, message: OTP_GENERIC });
});

const verifyResetOtp = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const email = normalizeEmail(body.email);
  const code = validateOtp(body.otp ?? body.code);

  const doc = await otpService.verifyOtp({ email, purpose: PURPOSES.PASSWORD_RESET, code });
  const resetToken = await otpService.issueResetToken(doc);

  return sendSuccess(res, { resetToken, expiresIn: 600 });
});

const resetPassword = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const email = normalizeEmail(body.email);
  const token = typeof body.resetToken === "string" ? body.resetToken.trim() : "";
  const newPassword = validatePassword(body.password ?? body.newPassword);

  if (!token) {
    throw ApiError.badRequest(
      "This reset link is invalid or has expired. Please start again.",
      "RESET_TOKEN_INVALID"
    );
  }

  const doc = await otpService.consumeResetToken({ email, token });

  const user = (doc.userId && (await User.findById(doc.userId))) || (await User.findOne({ email }));
  if (!user) {
    throw ApiError.badRequest("This reset link is invalid or has expired.", "RESET_TOKEN_INVALID");
  }

  user.passwordHash = await hashPassword(newPassword);
  await user.save();

  // Password changed: invalidate every existing session for this account.
  await sessionService.revokeAllForUser(user._id);

  return sendSuccess(res, { message: "Your password has been reset. Please sign in." });
});

/* --------------------------- Session helpers ----------------------------- */

const me = asyncHandler(async (req, res) => {
  return sendSuccess(res, {
    user: req.user ? req.user.toPublicJSON() : null
  });
});

const logout = asyncHandler(async (req, res) => {
  if (req.session) {
    await sessionService.revokeSession(res, req.session);
  } else {
    sessionService.clearCookies(res);
  }
  return sendSuccess(res, { message: "You have been signed out." });
});

/* ----------------------------- Delete account ---------------------------- */

const requestDeleteAccount = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const password = typeof body.password === "string" ? body.password : "";

  const user = await User.findById(req.user._id).select("+passwordHash");
  if (!user) {
    throw ApiError.unauthorized("Please sign in to continue.", "AUTH_REQUIRED");
  }

  const matches = await verifyPassword(password, user.passwordHash);
  if (!matches) {
    throw ApiError.unauthorized("Incorrect password.", "BAD_PASSWORD");
  }

  let expiresIn;
  try {
    ({ expiresIn } = await otpService.issueOtp({
      email: user.email,
      purpose: PURPOSES.DELETE_ACCOUNT,
      userId: user._id
    }));
  } catch (err) {
    if (err && err.code !== "OTP_COOLDOWN") throw err;
    expiresIn = 120;
  }

  return sendSuccess(res, { purpose: PURPOSES.DELETE_ACCOUNT, expiresIn });
});

const deleteAccount = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const code = validateOtp(body.otp ?? body.code);
  const password = typeof body.password === "string" ? body.password : "";

  const user = await User.findById(req.user._id).select("+passwordHash");
  if (!user) {
    throw ApiError.unauthorized("Please sign in to continue.", "AUTH_REQUIRED");
  }

  if (password) {
    const matches = await verifyPassword(password, user.passwordHash);
    if (!matches) {
      throw ApiError.unauthorized("Incorrect password.", "BAD_PASSWORD");
    }
  }

  const doc = await otpService.verifyOtp({
    email: user.email,
    purpose: PURPOSES.DELETE_ACCOUNT,
    code
  });
  await otpService.consumeOtp(doc);

  // Revoke every session, remove OTPs, then permanently delete the account.
  await sessionService.revokeAllForUser(user._id);
  await Otp.deleteMany({ email: user.email });
  await User.deleteOne({ _id: user._id });

  sessionService.clearCookies(res);

  return sendSuccess(res, { message: "Your account has been permanently deleted." });
});

module.exports = {
  signup,
  verifySignupOtp,
  login,
  verifyLoginOtp,
  resendOtp,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  me,
  logout,
  requestDeleteAccount,
  deleteAccount
};
