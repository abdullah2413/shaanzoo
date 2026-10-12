"use strict";

const path = require("path");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");

const config = require("./config/env");
const apiRouter = require("./routes");
const { attachUser } = require("./middleware/auth");
const { verifyOrigin, csrfProtection } = require("./middleware/csrf");
const { apiLimiter } = require("./middleware/rateLimiters");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const app = express();

/* ------------------------------ Security --------------------------------- */

app.disable("x-powered-by");
if (config.trustProxy) app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        fontSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: config.isProd ? [] : null
      }
    },
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" }
  })
);

app.use(
  cors({
    origin(origin, callback) {
      // Allow same-origin / non-browser requests (no Origin header).
      if (!origin) return callback(null, true);
      const clean = origin.replace(/\/$/, "");
      if (config.allowedOrigins.includes(clean)) return callback(null, true);
      // Disallowed origin: omit CORS headers (browser blocks the response).
      // The request is still rejected server-side by verifyOrigin() below.
      return callback(null, false);
    },
    credentials: true
  })
);

/* --------------------------- Body / input parsing ------------------------ */

app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));
app.use(cookieParser());

// Strip MongoDB operators ($ / .) from user input to prevent NoSQL injection.
app.use(mongoSanitize());
// Prevent HTTP parameter pollution.
app.use(hpp());

/* ------------------------------- API routes ------------------------------ */

app.use(
  "/api",
  attachUser,
  verifyOrigin,
  csrfProtection,
  apiLimiter,
  apiRouter
);

// Unknown API route -> JSON 404 (never falls through to static files).
app.use("/api", notFoundHandler);

/* ------------------------------ Static site ------------------------------ */

// Never serve backend source, config or tooling from the web root.
const BLOCKED = /^\/(server|tools|node_modules)(\/|$)|^\/(package(-lock)?\.json|\.env|\.env\.example|\.gitignore)$/i;
app.use((req, res, next) => {
  if (BLOCKED.test(req.path)) {
    return res.status(404).type("text/plain").send("Not found");
  }
  return next();
});

app.use(
  express.static(config.projectRoot, {
    index: "index.html",
    dotfiles: "deny",
    extensions: false,
    maxAge: config.isProd ? "1h" : 0
  })
);

// Any other non-API path: static pages only (404 as HTML fallback).
app.use((req, res) => {
  res.status(404).sendFile(path.resolve(config.projectRoot, "pages", "404.html"), (err) => {
    if (err) res.status(404).type("text/plain").send("Not found");
  });
});

/* ----------------------------- Error handling ---------------------------- */

app.use(errorHandler);

module.exports = app;
