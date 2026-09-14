const rateLimit = require("express-rate-limit");

/**
 * General limiter for all incoming API routes
 * Limit: 100 requests per 15 minutes per IP
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes.",
  },
});

/**
 * Stricter limiter for sensitive authentication endpoints (login, register, forgot-password)
 * Limit: 10 attempts per 15 minutes per IP
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts from this IP. Please try again after 15 minutes.",
  },
});

/**
 * Rate limiter for password-protected public share link verification
 * Limit: 10 attempts per 15 minutes per IP
 */
const shareVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many share password attempts. Please try again after 15 minutes.",
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
  shareVerifyLimiter,
};
