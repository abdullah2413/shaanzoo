"use strict";

const express = require("express");
const contactController = require("../controllers/contactController");
const { contactLimiter } = require("../middleware/rateLimiters");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/", contactLimiter, requireAuth, contactController.createContact);

module.exports = router;
