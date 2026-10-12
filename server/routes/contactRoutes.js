"use strict";

const express = require("express");
const contactController = require("../controllers/contactController");
const { contactLimiter } = require("../middleware/rateLimiters");

const router = express.Router();

router.post("/", contactLimiter, contactController.createContact);

module.exports = router;
