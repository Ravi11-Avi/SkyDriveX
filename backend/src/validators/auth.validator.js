const { body, validationResult } = require("express-validator");
const AppError = require("../utils/appError");

/**
 * Middleware helper to check validation result
 */
const validateResults = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMsgs = errors.array().map((err) => err.msg);
    return next(new AppError(errorMsgs.join(". "), 400));
  }
  next();
};

/**
 * Register validation rules
 */
const validateRegister = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  validateResults,
];

/**
 * Login validation rules
 */
const validateLogin = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address"),
  body("password")
    .notEmpty()
    .withMessage("Password is required"),
  validateResults,
];

module.exports = {
  validateRegister,
  validateLogin,
};
