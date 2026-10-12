"use strict";

const express = require("express");
const authController = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");
const {
  signupLimiter,
  loginLimiter,
  otpSendLimiter,
  otpVerifyLimiter,
  forgotLimiter,
  resetLimiter,
  deleteLimiter
} = require("../middleware/rateLimiters");

const router = express.Router();

/* Sign up + email verification */
router.post("/signup", signupLimiter, authController.signup);
router.post("/verify-signup-otp", otpVerifyLimiter, authController.verifySignupOtp);

/* Shared OTP resend */
router.post("/resend-otp", otpSendLimiter, authController.resendOtp);

/* Two-step sign in */
router.post("/login", loginLimiter, authController.login);
router.post("/verify-login-otp", otpVerifyLimiter, authController.verifyLoginOtp);

/* Password reset */
router.post("/forgot-password", forgotLimiter, authController.forgotPassword);
router.post("/verify-reset-otp", resetLimiter, authController.verifyResetOtp);
router.post("/reset-password", resetLimiter, authController.resetPassword);

/* Session */
router.get("/me", authController.me);
router.post("/logout", authController.logout);

/* Delete account (re-authentication + OTP) */
router.post("/request-delete-account", requireAuth, deleteLimiter, authController.requestDeleteAccount);
router.delete("/account", requireAuth, deleteLimiter, authController.deleteAccount);

module.exports = router;
