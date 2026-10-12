"use strict";

const erl = require("express-rate-limit");

const rateLimit = erl.rateLimit || erl.default || erl;
const ipKeyGenerator = erl.ipKeyGenerator;

function ipOf(req) {
  if (typeof ipKeyGenerator === "function") {
    try {
      return ipKeyGenerator(req.ip);
    } catch (_e) {
      /* fall through */
    }
  }
  return req.ip;
}

/** Key by IP + submitted email so one account cannot be hammered from many IPs. */
function ipEmailKey(req) {
  const email =
    req.body && typeof req.body.email === "string"
      ? req.body.email.trim().toLowerCase().slice(0, 254)
      : "";
  return `${ipOf(req)}:${email}`;
}

function limiter({ windowMs, max, keyGenerator, skipSuccessfulRequests = false }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    keyGenerator: keyGenerator || ((req) => ipOf(req)),
    handler: (_req, res) =>
      res.status(429).json({
        success: false,
        message: "Too many requests. Please wait a moment and try again.",
        code: "RATE_LIMITED"
      })
  });
}

const MIN = 60 * 1000;
const HOUR = 60 * MIN;

// Broad safety net for the whole API surface.
const apiLimiter = limiter({ windowMs: 15 * MIN, max: 600 });

// Security-sensitive endpoints get tighter, purpose-specific limits.
const signupLimiter = limiter({ windowMs: HOUR, max: 10, keyGenerator: ipEmailKey });
const loginLimiter = limiter({
  windowMs: 15 * MIN,
  max: 12,
  keyGenerator: ipEmailKey,
  skipSuccessfulRequests: true
});
const otpSendLimiter = limiter({ windowMs: 15 * MIN, max: 6, keyGenerator: ipEmailKey });
const otpVerifyLimiter = limiter({
  windowMs: 15 * MIN,
  max: 20,
  keyGenerator: ipOf,
  skipSuccessfulRequests: true
});
const forgotLimiter = limiter({ windowMs: HOUR, max: 6, keyGenerator: ipEmailKey });
const resetLimiter = limiter({ windowMs: HOUR, max: 12, keyGenerator: ipOf });
const deleteLimiter = limiter({ windowMs: HOUR, max: 6, keyGenerator: ipOf });
const contactLimiter = limiter({ windowMs: HOUR, max: 6, keyGenerator: ipOf });

module.exports = {
  apiLimiter,
  signupLimiter,
  loginLimiter,
  otpSendLimiter,
  otpVerifyLimiter,
  forgotLimiter,
  resetLimiter,
  deleteLimiter,
  contactLimiter
};
