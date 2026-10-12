"use strict";

/**
 * Centralised, validated environment configuration.
 *
 * Every secret is read from process.env (loaded from `.env`) and is NEVER
 * hard-coded. Missing required values fail fast at boot so the server never
 * runs in a half-configured, insecure state.
 */

const path = require("path");
const dotenv = require("dotenv");

// Load `.env` from the project root (one level above /server).
dotenv.config({ path: path.resolve(__dirname, "..", "..", ".env") });

function required(name) {
  const value = process.env[name];
  if (!value || !String(value).trim()) {
    throw new Error(
      `Missing required environment variable: ${name}. Copy .env.example to .env and fill it in.`
    );
  }
  return String(value).trim();
}

function optional(name, fallback) {
  const value = process.env[name];
  if (value === undefined || value === null || String(value).trim() === "") {
    return fallback;
  }
  return String(value).trim();
}

function bool(name, fallback) {
  const v = optional(name, undefined);
  if (v === undefined) return fallback;
  return ["1", "true", "yes", "on"].includes(v.toLowerCase());
}

function int(name, fallback) {
  const v = optional(name, undefined);
  if (v === undefined) return fallback;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

const NODE_ENV = optional("NODE_ENV", "development");
const isProd = NODE_ENV === "production";

const frontendUrls = optional("FRONTEND_URL", "http://localhost:3000")
  .split(",")
  .map((s) => s.trim().replace(/\/$/, ""))
  .filter(Boolean);

// On Vercel the deployment URLs are injected automatically. Include them so the
// front-end (same deployment) can talk to the API even when FRONTEND_URL has not
// been set explicitly. These are non-secret, publicly known hostnames.
const vercelUrls = [
  process.env.VERCEL_URL,
  process.env.VERCEL_BRANCH_URL,
  process.env.VERCEL_PROJECT_PRODUCTION_URL
]
  .filter(Boolean)
  .map((host) => `https://${String(host).replace(/^https?:\/\//, "").replace(/\/$/, "")}`);

const allowedOrigins = Array.from(new Set([...frontendUrls, ...vercelUrls]));

const config = {
  env: NODE_ENV,
  isProd,
  port: int("PORT", 3000),
  frontendUrl: allowedOrigins[0],
  allowedOrigins,
  // Vercel always runs behind a proxy; default to trusting it there so rate
  // limiting and logging see the real client IP.
  trustProxy: bool("TRUST_PROXY", Boolean(process.env.VERCEL)),

  db: {
    uri: required("MONGODB_URI"),
    name: optional("DB_NAME", "shanzoo")
  },

  secrets: {
    session: required("SESSION_SECRET"),
    otpPepper: optional("OTP_PEPPER", required("SESSION_SECRET"))
  },

  session: {
    ttlDays: int("SESSION_TTL_DAYS", 3),
    cookieName: "shanzoo.sid",
    csrfCookieName: "shanzoo.csrf"
  },

  otp: {
    ttlMinutes: int("OTP_TTL_MINUTES", 2),
    maxAttempts: int("OTP_MAX_ATTEMPTS", 5),
    resendCooldownSeconds: int("OTP_RESEND_COOLDOWN_SECONDS", 60)
  },

  mail: {
    transport: optional("MAIL_TRANSPORT", "auto").toLowerCase(),
    resendApiKey: optional("RESEND_API_KEY", ""),
    resendFrom: optional("RESEND_FROM_EMAIL", ""),
    receiverEmail: optional("CONTACT_RECEIVER_EMAIL", "info@sganzoo.com"),
    smtp: {
      host: optional("SMTP_HOST", ""),
      port: int("SMTP_PORT", 465),
      secure: bool("SMTP_SECURE", true),
      user: optional("SMTP_USER", ""),
      pass: optional("SMTP_APP_PASSWORD", ""),
      from: optional("SMTP_FROM_EMAIL", optional("SMTP_USER", ""))
    }
  }
};

// Resolve absolute path to project root for static file serving.
config.projectRoot = path.resolve(__dirname, "..", "..");

module.exports = config;
