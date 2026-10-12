"use strict";

const express = require("express");
const authRoutes = require("./authRoutes");
const contactRoutes = require("./contactRoutes");

const router = express.Router();

router.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "API is running",
    data: { status: "ok", time: new Date().toISOString() }
  });
});

router.use("/auth", authRoutes);
router.use("/contact", contactRoutes);

module.exports = router;
