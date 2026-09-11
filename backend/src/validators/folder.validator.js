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

const validateCreateFolder = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Folder name is required")
    .isLength({ min: 1, max: 100 })
    .withMessage("Folder name must be between 1 and 100 characters")
    .custom((val) => {
      if (/[/\\:*?"<>|]/.test(val)) {
        throw new Error('Folder name cannot contain special characters: / \\ : * ? " < > |');
      }
      return true;
    }),
  body("parentFolder")
    .optional({ nullable: true })
    .isMongoId()
    .withMessage("Invalid parent folder ID"),
  body("color")
    .optional()
    .matches(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/)
    .withMessage("Color must be a valid hex code (e.g. #4F46E5)"),
  validateResults,
];

const validateUpdateFolder = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Folder name cannot be empty")
    .isLength({ min: 1, max: 100 })
    .withMessage("Folder name must be between 1 and 100 characters")
    .custom((val) => {
      if (/[/\\:*?"<>|]/.test(val)) {
        throw new Error('Folder name cannot contain special characters: / \\ : * ? " < > |');
      }
      return true;
    }),
  body("color")
    .optional()
    .matches(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/)
    .withMessage("Color must be a valid hex code"),
  body("isFavorite")
    .optional()
    .isBoolean()
    .withMessage("isFavorite must be a boolean"),
  validateResults,
];

const validateMoveFolder = [
  body("targetParentFolderId")
    .optional({ nullable: true })
    .custom((val) => {
      if (val === null || val === "" || val === undefined) return true;
      const isValidMongoId = /^[0-9a-fA-F]{24}$/.test(val);
      if (!isValidMongoId) throw new Error("Invalid target parent folder ID");
      return true;
    }),
  validateResults,
];

module.exports = {
  validateCreateFolder,
  validateUpdateFolder,
  validateMoveFolder,
};
