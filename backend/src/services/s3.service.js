const {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { s3Client, bucketName, isS3Configured } = require("../config/s3");
const AppError = require("../utils/appError");

/**
 * Upload a file buffer to AWS S3
 * @param {Buffer} buffer - File buffer from multer
 * @param {string} key - S3 object key (path inside bucket)
 * @param {string} mimeType - File MIME type
 * @returns {Promise<{ s3Key: string, s3Url: string }>}
 */
const uploadFileToS3 = async (buffer, key, mimeType) => {
  if (!isS3Configured) {
    throw new AppError(
      "AWS S3 is not configured. Please set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, and AWS_BUCKET_NAME in your environment.",
      500
    );
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  });

  await s3Client.send(command);

  const s3Url = `https://${bucketName}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`;

  return {
    s3Key: key,
    s3Url,
  };
};

/**
 * Generate a presigned URL for downloading a file (forces browser download)
 * @param {string} key - S3 object key
 * @param {string} originalName - Original filename for Content-Disposition
 * @param {number} expiresIn - URL lifetime in seconds (default 3600 = 1 hour)
 * @returns {Promise<string>}
 */
const getPresignedDownloadUrl = async (key, originalName, expiresIn = 3600) => {
  if (!isS3Configured) {
    throw new AppError("AWS S3 is not configured.", 500);
  }

  const safeName = encodeURIComponent(originalName || "file");
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${safeName}"`,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
};

/**
 * Generate a presigned URL for inline viewing/previewing in browser
 * @param {string} key - S3 object key
 * @param {string} mimeType - File MIME type
 * @param {number} expiresIn - URL lifetime in seconds
 * @returns {Promise<string>}
 */
const getPresignedViewUrl = async (key, mimeType, expiresIn = 3600) => {
  if (!isS3Configured) {
    throw new AppError("AWS S3 is not configured.", 500);
  }

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
    ResponseContentType: mimeType || "application/octet-stream",
    ResponseContentDisposition: "inline",
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
};

/**
 * Delete a single file from AWS S3
 * @param {string} key - S3 object key
 */
const deleteFileFromS3 = async (key) => {
  if (!isS3Configured) {
    console.warn("AWS S3 is not configured; skipping S3 file deletion for key:", key);
    return;
  }

  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  await s3Client.send(command);
};

/**
 * Delete multiple files from AWS S3 in batch
 * @param {string[]} keys - Array of S3 object keys
 */
const deleteMultipleFilesFromS3 = async (keys) => {
  if (!isS3Configured || !keys || keys.length === 0) {
    return;
  }

  const objects = keys.map((key) => ({ Key: key }));
  const command = new DeleteObjectsCommand({
    Bucket: bucketName,
    Delete: {
      Objects: objects,
      Quiet: true,
    },
  });

  await s3Client.send(command);
};

module.exports = {
  uploadFileToS3,
  getPresignedDownloadUrl,
  getPresignedViewUrl,
  deleteFileFromS3,
  deleteMultipleFilesFromS3,
};
