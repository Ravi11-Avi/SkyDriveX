const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "fallback-jwt-secret-key-123456";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "fallback-jwt-refresh-secret-key-123456";

/**
 * Generate a short-lived access token
 * @param {string} userId - User ID to sign in payload
 * @returns {string} Signed JWT
 */
const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: "15m",
  });
};

/**
 * Generate a long-lived refresh token
 * @param {string} userId - User ID to sign in payload
 * @returns {string} Signed JWT
 */
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
};

/**
 * Verify an access token
 * @param {string} token - The access token to verify
 * @returns {object} Decoded payload
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

/**
 * Verify a refresh token
 * @param {string} token - The refresh token to verify
 * @returns {object} Decoded payload
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, JWT_REFRESH_SECRET);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
