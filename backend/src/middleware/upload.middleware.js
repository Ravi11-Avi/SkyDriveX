const multer = require("multer");
const AppError = require("../utils/appError");

// Max file size default: 100MB
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE_MB || "100", 10) * 1024 * 1024;

const storage = multer.memoryStorage();

const multerInstance = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10, // Max 10 files per batch upload
  },
});

/**
 * Middleware wrapper for single file upload
 * Field name: 'file'
 */
const uploadSingle = (req, res, next) => {
  const upload = multerInstance.single("file");
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return next(
          new AppError(`File is too large. Maximum allowed size is ${process.env.MAX_FILE_SIZE_MB || 100}MB.`, 400)
        );
      }
      return next(new AppError(`Upload error: ${err.message}`, 400));
    } else if (err) {
      return next(new AppError(`Upload error: ${err.message}`, 400));
    }
    next();
  });
};

/**
 * Middleware wrapper for multiple files upload
 * Field name: 'files'
 */
const uploadMultiple = (req, res, next) => {
  const upload = multerInstance.array("files", 10);
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return next(
          new AppError(`One or more files exceed the maximum allowed size of ${process.env.MAX_FILE_SIZE_MB || 100}MB.`, 400)
        );
      }
      if (err.code === "LIMIT_FILE_COUNT") {
        return next(new AppError("Too many files. Maximum 10 files can be uploaded at once.", 400));
      }
      return next(new AppError(`Upload error: ${err.message}`, 400));
    } else if (err) {
      return next(new AppError(`Upload error: ${err.message}`, 400));
    }
    next();
  });
};

module.exports = {
  uploadSingle,
  uploadMultiple,
};
