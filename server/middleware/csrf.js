"use strict";

const config = require("../config/env");
const ApiError = require("../utils/ApiError");
const { sha256, safeEqual } = require("../utils/security");

const UNSAFE = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function originOf(req) {
  const origin = req.get("origin");
  if (origin) return origin.replace(/\/$/, "");
  const referer = req.get("referer");
  if (referer) {
    try {
      return new URL(referer).origin.replace(/\/$/, "");
    } catch (_e) {
      return null;
    }
  }
  return null;
}

/**
 * Reject state-changing requests whose Origin/Referer is not an approved
 * site origin. Protects cookie-authenticated requests (and login/CSRF-style
 * attacks) from other sites.
 */
function verifyOrigin(req, _res, next) {
  if (!UNSAFE.has(req.method)) return next();

  const origin = originOf(req);
  if (!origin) {
    // No Origin/Referer (e.g. curl / native clients). Allowed: such clients do
    // not carry ambient browser cookies, so CSRF does not apply.
    return next();
  }
  if (config.allowedOrigins.includes(origin)) return next();

  return next(ApiError.forbidden("Request blocked by origin policy.", "BAD_ORIGIN"));
}

/**
 * Double-submit-cookie CSRF protection for authenticated (session) requests.
 * The client must echo the `X-CSRF-Token` header matching the readable csrf
 * cookie AND the hash stored on the server-side session.
 */
function csrfProtection(req, _res, next) {
  if (!UNSAFE.has(req.method)) return next();
  if (!req.session) return next(); // unauthenticated: no session to protect

  const header = req.get("x-csrf-token");
  const cookie = req.cookies ? req.cookies[config.session.csrfCookieName] : null;

  if (!header || !cookie || !safeEqual(header, cookie)) {
    return next(ApiError.forbidden("Invalid CSRF token.", "CSRF_FAILED"));
  }
  if (!safeEqual(sha256(header), req.session.csrfHash)) {
    return next(ApiError.forbidden("Invalid CSRF token.", "CSRF_FAILED"));
  }
  return next();
}

module.exports = { verifyOrigin, csrfProtection };
