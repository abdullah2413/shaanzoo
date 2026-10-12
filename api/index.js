"use strict";

/**
 * Vercel serverless entry point.
 *
 * The entire Express application (API routes + static site) is exposed as a
 * single function so local and production behaviour are identical: Helmet,
 * CORS/CSRF, rate limiting, the blocked-path guard, static serving and the
 * HTML 404 fallback all run through the same code path.
 *
 * The MongoDB connection is created once per function instance and reused
 * across warm invocations.
 */

const app = require("../server/app");
const { connectDatabase } = require("../server/config/db");

let connectionPromise = null;

function ensureDatabase() {
  if (!connectionPromise) {
    connectionPromise = connectDatabase().catch((err) => {
      // Allow the next invocation to retry a failed connection.
      connectionPromise = null;
      throw err;
    });
  }
  return connectionPromise;
}

module.exports = async function handler(req, res) {
  try {
    await ensureDatabase();
  } catch (err) {
    console.error(`[serverless] Database connection failed: ${err.message}`);
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, message: "Service temporarily unavailable." }));
    return;
  }

  return app(req, res);
};
