const { body, validationResult } = require("express-validator");
const AppError = require("../utils/appError");

const validateResults = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMsgs = errors.array().map((err) => err.msg);
    return next(new AppError(errorMsgs.join(". "), 400));
  }
  next();
};

const validateCreateShare = [
  body("itemType")
    .trim()
    .notEmpty()
    .withMessage("Item type is required")
    .isIn(["file", "folder"])
    .withMessage("Item type must be either 'file' or 'folder'"),
  body("itemId")
    .trim()
    .notEmpty()
    .withMessage("Item ID is required")
    .isMongoId()
    .withMessage("Invalid Item ID"),
  body("permission")
    .optional()
    .isIn(["view", "download"])
    .withMessage("Permission must be either 'view' or 'download'"),
  body("password")
    .optional({ nullable: true })
    .isString()
    .withMessage("Password must be a string")
    .isLength({ min: 4 })
    .withMessage("Share password must be at least 4 characters long"),
  body("expiresInHours")
    .optional({ nullable: true })
    .isInt({ min: 1, max: 8760 })
    .withMessage("expiresInHours must be between 1 and 8760 (1 year)"),
  body("expiresAt")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("expiresAt must be a valid ISO 8601 date string"),
  validateResults,
];

const validateUpdateShare = [
  body("permission")
    .optional()
    .isIn(["view", "download"])
    .withMessage("Permission must be either 'view' or 'download'"),
  body("password")
    .optional({ nullable: true })
    .isString()
    .withMessage("Password must be a string"),
  body("removePassword")
    .optional()
    .isBoolean()
    .withMessage("removePassword must be a boolean"),
  body("expiresAt")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("expiresAt must be a valid date"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
  validateResults,
];

const validateVerifyPassword = [
  body("password")
    .notEmpty()
    .withMessage("Password is required"),
  validateResults,
];

module.exports = {
  validateCreateShare,
  validateUpdateShare,
  validateVerifyPassword,
};
