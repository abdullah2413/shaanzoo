"use strict";

/**
 * Operational error with an HTTP status code and a safe public message.
 * Anything that is not an ApiError is treated as an unexpected error and its
 * message is never sent to the client in production.
 */
class ApiError extends Error {
  constructor(statusCode, message, code) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code || undefined;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, code) {
    return new ApiError(400, message || "Invalid request.", code);
  }

  static unauthorized(message, code) {
    return new ApiError(401, message || "Authentication required.", code);
  }

  static forbidden(message, code) {
    return new ApiError(403, message || "You are not allowed to do that.", code);
  }

  static notFound(message, code) {
    return new ApiError(404, message || "Not found.", code);
  }

  static conflict(message, code) {
    return new ApiError(409, message || "That already exists.", code);
  }

  static tooMany(message, code) {
    return new ApiError(429, message || "Too many requests. Please try again later.", code);
  }
}

module.exports = ApiError;
