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

const validateUpdateFile = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("File name cannot be empty")
    .isLength({ min: 1, max: 255 })
    .withMessage("File name must be between 1 and 255 characters")
    .custom((val) => {
      if (/[/\\:*?"<>|]/.test(val)) {
        throw new Error('File name cannot contain special characters: / \\ : * ? " < > |');
      }
      return true;
    }),
  body("isFavorite")
    .optional()
    .isBoolean()
    .withMessage("isFavorite must be a boolean"),
  body("tags")
    .optional()
    .isArray()
    .withMessage("Tags must be an array of strings"),
  validateResults,
];

const validateMoveFile = [
  body("targetFolderId")
    .optional({ nullable: true })
    .custom((val) => {
      if (val === null || val === "" || val === undefined) return true;
      const isValidMongoId = /^[0-9a-fA-F]{24}$/.test(val);
      if (!isValidMongoId) throw new Error("Invalid target folder ID");
      return true;
    }),
  validateResults,
];

const validateBatchFiles = [
  body("fileIds")
    .isArray({ min: 1 })
    .withMessage("fileIds must be a non-empty array of file IDs"),
  body("fileIds.*")
    .isMongoId()
    .withMessage("Each file ID must be a valid MongoDB ObjectId"),
  validateResults,
];

const validateBatchMoveFiles = [
  body("fileIds")
    .isArray({ min: 1 })
    .withMessage("fileIds must be a non-empty array of file IDs"),
  body("fileIds.*")
    .isMongoId()
    .withMessage("Each file ID must be a valid MongoDB ObjectId"),
  body("targetFolderId")
    .optional({ nullable: true })
    .custom((val) => {
      if (val === null || val === "" || val === undefined || val === "root") return true;
      const isValidMongoId = /^[0-9a-fA-F]{24}$/.test(val);
      if (!isValidMongoId) throw new Error("Invalid target folder ID");
      return true;
    }),
  validateResults,
];

module.exports = {
  validateUpdateFile,
  validateMoveFile,
  validateBatchFiles,
  validateBatchMoveFiles,
};
