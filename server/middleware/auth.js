"use strict";

const ApiError = require("../utils/ApiError");
const sessionService = require("../services/sessionService");
const asyncHandler = require("../utils/asyncHandler");

/**
 * Resolve the authenticated session for the current request and attach the
 * server-verified user to `req.user`. Never trusts any id supplied by the
 * client. Applied to the API router only.
 */
const attachUser = asyncHandler(async (req, _res, next) => {
  req.user = null;
  req.session = null;
  try {
    const resolved = await sessionService.resolveSession(req);
    if (resolved) {
      req.user = resolved.user;
      req.session = resolved.session;
    }
  } catch (err) {
    // If session resolution fails we treat the request as unauthenticated
    // rather than crashing; protected routes will then reject it.
    req.user = null;
    req.session = null;
  }
  next();
});

/** Require a valid authenticated session. */
function requireAuth(req, _res, next) {
  if (!req.user || !req.session) {
    return next(ApiError.unauthorized("Please sign in to continue.", "AUTH_REQUIRED"));
  }
  return next();
}

/** Require an authenticated session whose email has been verified. */
function requireVerified(req, _res, next) {
  if (!req.user) {
    return next(ApiError.unauthorized("Please sign in to continue.", "AUTH_REQUIRED"));
  }
  if (!req.user.isEmailVerified) {
    return next(ApiError.forbidden("Please verify your email address first.", "EMAIL_NOT_VERIFIED"));
  }
  return next();
}

module.exports = { attachUser, requireAuth, requireVerified };
