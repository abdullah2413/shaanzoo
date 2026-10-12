"use strict";

const Session = require("../models/Session");
const User = require("../models/User");
const config = require("../config/env");
const { generateToken, sha256 } = require("../utils/security");

const ttlMs = () => config.session.ttlDays * 24 * 60 * 60 * 1000;

function cookieBase() {
  return {
    httpOnly: true,
    secure: config.isProd, // HTTPS-only in production
    sameSite: "lax",
    path: "/"
  };
}

function setCookies(res, { rawToken, csrfToken }) {
  const maxAge = ttlMs();
  res.cookie(config.session.cookieName, rawToken, { ...cookieBase(), maxAge });
  // CSRF token is intentionally NOT httpOnly so the front-end can echo it in a
  // header (double-submit-cookie pattern). It is useless without the session.
  res.cookie(config.session.csrfCookieName, csrfToken, {
    ...cookieBase(),
    httpOnly: false,
    maxAge
  });
}

function clearCookies(res) {
  res.clearCookie(config.session.cookieName, { ...cookieBase(), maxAge: undefined });
  res.clearCookie(config.session.csrfCookieName, {
    ...cookieBase(),
    httpOnly: false,
    maxAge: undefined
  });
}

/**
 * Create a new authenticated session for a user and set its cookies.
 * Returns the CSRF token so the caller can hand it to the client if needed.
 */
async function createSession(user, req, res) {
  const rawToken = generateToken(32);
  const csrfToken = generateToken(32);
  const expiresAt = new Date(Date.now() + ttlMs());

  await Session.create({
    userId: user._id,
    tokenHash: sha256(rawToken),
    csrfHash: sha256(csrfToken),
    userAgent: (req.get("user-agent") || "").slice(0, 400),
    ip: (req.ip || "").slice(0, 100),
    lastSeenAt: new Date(),
    expiresAt
  });

  setCookies(res, { rawToken, csrfToken });
  return { csrfToken };
}

/** Look up the session/user for the current request, if any. */
async function resolveSession(req) {
  const raw = req.cookies ? req.cookies[config.session.cookieName] : null;
  if (!raw) return null;

  const session = await Session.findOne({ tokenHash: sha256(raw) });
  if (!session) return null;

  if (new Date(session.expiresAt).getTime() < Date.now()) {
    await Session.deleteOne({ _id: session._id }).catch(() => {});
    return null;
  }

  const user = await User.findById(session.userId);
  if (!user) {
    await Session.deleteOne({ _id: session._id }).catch(() => {});
    return null;
  }

  return { session, user };
}

async function touchSession(session) {
  // Best-effort activity update; ignore failures.
  session.lastSeenAt = new Date();
  await session.save().catch(() => {});
}

async function revokeSession(res, session) {
  if (session) {
    await Session.deleteOne({ _id: session._id }).catch(() => {});
  }
  clearCookies(res);
}

async function revokeAllForUser(userId) {
  await Session.deleteMany({ userId });
}

module.exports = {
  createSession,
  resolveSession,
  touchSession,
  revokeSession,
  revokeAllForUser,
  clearCookies,
  cookieBase
};
