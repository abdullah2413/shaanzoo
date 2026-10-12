"use strict";

const config = require("../config/env");

/** 404 handler for unknown API routes. */
function notFoundHandler(_req, res) {
  res.status(404).json({ success: false, message: "Resource not found." });
}

/**
 * Centralised error handler. Always returns a consistent JSON shape and never
 * leaks stack traces, database details, credentials or internal messages in
 * production.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  let statusCode = 500;
  let message = "Something went wrong. Please try again.";
  let code;

  if (err && err.name === "ApiError") {
    statusCode = err.statusCode || 500;
    message = err.message;
    code = err.code;
  } else if (err && err.name === "ValidationError") {
    statusCode = 400;
    message = "Please check the information you provided.";
    code = "VALIDATION_ERROR";
  } else if (err && err.name === "CastError") {
    statusCode = 400;
    message = "Invalid request.";
    code = "INVALID_ID";
  } else if (err && err.code === 11000) {
    statusCode = 409;
    message = "An account with this email already exists.";
    code = "DUPLICATE_KEY";
  } else if (err && err.type === "entity.too.large") {
    statusCode = 413;
    message = "The request is too large.";
    code = "PAYLOAD_TOO_LARGE";
  } else if (err && err.statusCode && err.statusCode < 500) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Log server-side for debugging; never log secrets, bodies or tokens.
  if (statusCode >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl} -> ${err && err.message}`);
    if (!config.isProd && err && err.stack) {
      console.error(err.stack);
    }
  }

  const payload = { success: false, message };
  if (code) payload.code = code;

  res.status(statusCode).json(payload);
}

module.exports = { notFoundHandler, errorHandler };
