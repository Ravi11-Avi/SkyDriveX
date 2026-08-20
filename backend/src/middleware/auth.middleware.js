const User = require("../models/user.model");
const AppError = require("../utils/appError");
const { verifyAccessToken } = require("../utils/jwt");

/**
 * Middleware to protect private API endpoints
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Get token from Authorization header or cookies
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return next(new AppError("You are not logged in! Please log in to get access.", 401));
    }

    // 2. Verify token
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      return next(new AppError("Invalid or expired token. Please log in again.", 401));
    }

    // 3. Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(new AppError("The user belonging to this token no longer exists.", 401));
    }

    // 4. Grant access to protected route by attaching user to request
    req.user = currentUser;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  protect,
};
