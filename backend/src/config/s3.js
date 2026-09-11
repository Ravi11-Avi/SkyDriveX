const { S3Client } = require("@aws-sdk/client-s3");

const region = process.env.AWS_REGION || "us-east-1";
const accessKeyId = process.env.AWS_ACCESS_KEY_ID || "";
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || "";
const bucketName = process.env.AWS_BUCKET_NAME || "";

const isS3Configured = Boolean(
  accessKeyId &&
  secretAccessKey &&
  bucketName &&
  !accessKeyId.includes("placeholder")
);

const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

module.exports = {
  s3Client,
  bucketName,
  isS3Configured,
};
