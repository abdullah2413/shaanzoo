"use strict";

/** Consistent success envelope. */
function sendSuccess(res, data, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data: data === undefined ? null : data });
}

module.exports = { sendSuccess };
