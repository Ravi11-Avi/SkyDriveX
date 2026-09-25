const fs = require("fs");
const path = require("path");
const {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { s3Client, bucketName, isS3Configured } = require("../config/s3");

// Local storage fallback directory
const LOCAL_STORAGE_DIR = path.join(__dirname, "../../uploads");

// Ensure local storage directory exists
if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
  fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
}

/**
 * Upload file buffer to AWS S3 (or local disk fallback)
 * @param {Buffer} buffer - File buffer
 * @param {string} key - Storage key
 * @param {string} mimeType - MIME type
 * @returns {Promise<{ s3Key: string, s3Url: string, storageType: 's3'|'local' }>}
 */
const uploadFile = async (buffer, key, mimeType) => {
  if (isS3Configured) {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    });
    await s3Client.send(command);
    const s3Url = `https://${bucketName}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`;
    return { s3Key: key, s3Url, storageType: "s3" };
  }

  // Local storage fallback
  const localFilePath = path.join(LOCAL_STORAGE_DIR, key);
  const localDirPath = path.dirname(localFilePath);
  if (!fs.existsSync(localDirPath)) {
    fs.mkdirSync(localDirPath, { recursive: true });
  }
  await fs.promises.writeFile(localFilePath, buffer);

  const localUrl = `/api/v1/files/stream/${encodeURIComponent(key)}`;
  return { s3Key: key, s3Url: localUrl, storageType: "local" };
};

/**
 * Generate download URL (Presigned for S3 or local stream URL)
 * @param {string} key - Storage key
 * @param {string} originalName - Download filename
 * @param {number} expiresIn - URL expiry in seconds
 * @returns {Promise<string>}
 */
const getPresignedDownloadUrl = async (key, originalName, expiresIn = 3600) => {
  if (isS3Configured) {
    const safeName = encodeURIComponent(originalName || "file");
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${safeName}"`,
    });
    return await getSignedUrl(s3Client, command, { expiresIn });
  }

  return `/api/v1/files/stream/${encodeURIComponent(key)}?download=true&name=${encodeURIComponent(originalName || "file")}`;
};

/**
 * Generate preview/view URL (Presigned for S3 or local stream URL)
 * @param {string} key - Storage key
 * @param {string} mimeType - MIME type
 * @param {number} expiresIn - URL expiry in seconds
 * @returns {Promise<string>}
 */
const getPresignedViewUrl = async (key, mimeType, expiresIn = 3600) => {
  if (isS3Configured) {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
      ResponseContentType: mimeType || "application/octet-stream",
      ResponseContentDisposition: "inline",
    });
    return await getSignedUrl(s3Client, command, { expiresIn });
  }

  return `/api/v1/files/stream/${encodeURIComponent(key)}`;
};

/**
 * Delete a single file from storage
 * @param {string} key - Storage key
 */
const deleteFile = async (key) => {
  if (!key) return;

  if (isS3Configured) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      });
      await s3Client.send(command);
    } catch (err) {
      console.warn("Failed to delete S3 file:", key, err.message);
    }
    return;
  }

  // Local file delete
  try {
    const localFilePath = path.join(LOCAL_STORAGE_DIR, key);
    if (fs.existsSync(localFilePath)) {
      await fs.promises.unlink(localFilePath);
    }
  } catch (err) {
    console.warn("Failed to delete local file:", key, err.message);
  }
};

/**
 * Delete multiple files in batch
 * @param {string[]} keys - Storage keys array
 */
const deleteMultipleFiles = async (keys) => {
  if (!keys || keys.length === 0) return;

  if (isS3Configured) {
    try {
      const objects = keys.map((key) => ({ Key: key }));
      const command = new DeleteObjectsCommand({
        Bucket: bucketName,
        Delete: {
          Objects: objects,
          Quiet: true,
        },
      });
      await s3Client.send(command);
    } catch (err) {
      console.warn("Failed to batch delete S3 files:", err.message);
    }
    return;
  }

  // Local delete
  for (const key of keys) {
    await deleteFile(key);
  }
};

/**
 * Get readable stream of a file for ZIP packaging / direct streaming
 * @param {string} key - Storage key
 * @returns {Promise<NodeJS.ReadableStream>}
 */
const getFileStream = async (key) => {
  if (isS3Configured) {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    const response = await s3Client.send(command);
    return response.Body;
  }

  const localFilePath = path.join(LOCAL_STORAGE_DIR, key);
  if (!fs.existsSync(localFilePath)) {
    throw new Error(`Local file not found: ${key}`);
  }
  return fs.createReadStream(localFilePath);
};

module.exports = {
  uploadFileToS3: uploadFile,
  uploadFile,
  getPresignedDownloadUrl,
  getPresignedViewUrl,
  deleteFileFromS3: deleteFile,
  deleteFile,
  deleteMultipleFilesFromS3: deleteMultipleFiles,
  deleteMultipleFiles,
  getFileStream,
  isS3Configured,
  LOCAL_STORAGE_DIR,
};
