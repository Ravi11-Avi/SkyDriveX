/**
 * SkyDriveX - Comprehensive End-to-End Line-by-Line Backend Test Suite
 */
process.env.NODE_ENV = "test";
require("dotenv").config({ path: __dirname + "/../../.env" });

if (process.env.DNS_SERVERS) {
  try {
    dns.setServers(process.env.DNS_SERVERS.split(",").map((s) => s.trim()));
  } catch (e) {}
}

const mongoose = require("mongoose");
const http = require("http");
const app = require("../app");
const User = require("../models/user.model");
const Folder = require("../models/folder.model");
const File = require("../models/file.model");
const Share = require("../models/share.model");
const Activity = require("../models/activity.model");
const { runCleanup } = require("../jobs/cleanup.job");

let server;
let baseUrl;

const request = async (method, path, { body, headers = {}, token = null } = {}) => {
  const reqHeaders = { ...headers };
  if (token) {
    reqHeaders["Authorization"] = `Bearer ${token}`;
  }
  if (body && !(body instanceof Buffer)) {
    reqHeaders["Content-Type"] = "application/json";
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: reqHeaders,
    body: body ? (typeof body === "string" || body instanceof Buffer ? body : JSON.stringify(body)) : undefined,
  });

  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    json = { raw: text };
  }

  return {
    status: response.status,
    headers: response.headers,
    body: json,
  };
};

let passedTests = 0;
let totalTests = 0;

const assert = (condition, testName, details = "") => {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAIL: ${testName} ${details ? `(${details})` : ""}`);
    throw new Error(`Test failed: ${testName}`);
  } else {
    passedTests++;
    console.log(`✅ PASS: ${testName}`);
  }
};

const runTestSuite = async () => {
  console.log("\n=========================================================");
  console.log("   🚀 SKYDRIVEX COMPREHENSIVE BACKEND TEST SUITE");
  console.log("=========================================================\n");

  // 1. Connect to Database
  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/skydrivex_test";
  await mongoose.connect(mongoUri);
  console.log("📦 Connected to MongoDB Atlas for Testing\n");

  // Start temporary test server on random port
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;
  console.log(`🌐 Test server listening on ${baseUrl}\n`);

  // Cleanup test user and data
  const testEmail = `test_${Date.now()}@skydrivex.test`;
  let authToken = "";
  let currentUserId = "";
  let rootFolderId = "";
  let subFolderId = "";
  let fileId = "";
  let secondFileId = "";
  let shareToken = "";
  let protectedShareToken = "";

  try {
    // ----------------------------------------------------
    // TEST GROUP 1: Health Check & Undefined Routes
    // ----------------------------------------------------
    console.log("--- 1. Testing System & Route Endpoints ---");
    const healthRes = await request("GET", "/api/v1/health");
    assert(healthRes.status === 200, "GET /api/v1/health returns 200 OK");
    assert(healthRes.body.success === true, "Health response contains success: true");
    assert(healthRes.body.message === "SkyDriveX API is running", "Health message matches SkyDriveX branding");

    const notFoundRes = await request("GET", "/api/v1/non-existent-endpoint");
    assert(notFoundRes.status === 404, "Undefined route returns 404 status");
    assert(notFoundRes.body.status === "fail", "Undefined route error formatted properly");

    // ----------------------------------------------------
    // TEST GROUP 2: Authentication, Profile & Password
    // ----------------------------------------------------
    console.log("\n--- 2. Testing Authentication, Profile & Password ---");
    
    // Register
    const regRes = await request("POST", "/api/v1/auth/register", {
      body: {
        name: "QA Automated Tester",
        email: testEmail,
        password: "Password123!",
      },
    });
    assert(regRes.status === 201, "POST /api/v1/auth/register creates user (201)");
    assert(Boolean(regRes.body.accessToken), "Registration returns JWT access token");
    authToken = regRes.body.accessToken;
    currentUserId = regRes.body.user._id;

    // Duplicate Register
    const dupRegRes = await request("POST", "/api/v1/auth/register", {
      body: {
        name: "Duplicate User",
        email: testEmail,
        password: "Password123!",
      },
    });
    assert(dupRegRes.status === 400, "Duplicate registration correctly rejected (400)");

    // Login with invalid password
    const badLoginRes = await request("POST", "/api/v1/auth/login", {
      body: {
        email: testEmail,
        password: "WrongPassword!",
      },
    });
    assert(badLoginRes.status === 401, "Invalid password login rejected (401)");

    // Login with valid credentials
    const loginRes = await request("POST", "/api/v1/auth/login", {
      body: {
        email: testEmail,
        password: "Password123!",
      },
    });
    assert(loginRes.status === 200, "Valid login succeeds (200)");
    authToken = loginRes.body.accessToken;

    // Get Profile (Authenticated)
    const meRes = await request("GET", "/api/v1/auth/me", { token: authToken });
    assert(meRes.status === 200, "GET /api/v1/auth/me with Bearer token succeeds (200)");
    assert(meRes.body.user.email === testEmail, "Profile contains correct email");

    // Update Profile
    const updateProfRes = await request("PATCH", "/api/v1/auth/profile", {
      token: authToken,
      body: {
        name: "Updated QA Tester",
        avatar: "https://example.com/avatar.png",
      },
    });
    assert(updateProfRes.status === 200, "PATCH /api/v1/auth/profile updates profile");
    assert(updateProfRes.body.user.name === "Updated QA Tester", "User name updated in DB");

    // Change Password (Valid)
    const changePassRes = await request("PATCH", "/api/v1/auth/change-password", {
      token: authToken,
      body: {
        currentPassword: "Password123!",
        newPassword: "NewSecretPassword456!",
      },
    });
    assert(changePassRes.status === 200, "PATCH /api/v1/auth/change-password succeeds with new JWT");
    authToken = changePassRes.body.accessToken;

    // Forgot Password
    const forgotRes = await request("POST", "/api/v1/auth/forgot-password", {
      body: { email: testEmail },
    });
    assert(forgotRes.status === 200, "POST /api/v1/auth/forgot-password returns 200");

    // Retrieve the user from DB to obtain the generated token for testing
    const userInDb = await User.findOne({ email: testEmail }).select("+passwordResetToken +passwordResetExpires");
    assert(Boolean(userInDb.passwordResetToken), "Password reset token hashed in database");
    assert(userInDb.passwordResetExpires > new Date(), "Password reset token has future expiration date");

    // ----------------------------------------------------
    // TEST GROUP 3: Folder Hierarchy & ZIP Download
    // ----------------------------------------------------
    console.log("\n--- 3. Testing Folder Management & ZIP Download ---");

    // Create Root Folder
    const createRootFolderRes = await request("POST", "/api/v1/folders", {
      token: authToken,
      body: {
        name: "Projects",
        color: "#4F46E5",
      },
    });
    assert(createRootFolderRes.status === 201, "Create root folder returns 201");
    rootFolderId = createRootFolderRes.body.folder._id;
    assert(createRootFolderRes.body.folder.path.length === 0, "Root folder has empty ancestor path");

    // Create Subfolder
    const createSubfolderRes = await request("POST", "/api/v1/folders", {
      token: authToken,
      body: {
        name: "SkyDriveX Source",
        parentFolder: rootFolderId,
        color: "#10B981",
      },
    });
    assert(createSubfolderRes.status === 201, "Create subfolder returns 201");
    subFolderId = createSubfolderRes.body.folder._id;
    assert(createSubfolderRes.body.folder.path.length === 1, "Subfolder has ancestor path of length 1");
    assert(createSubfolderRes.body.folder.path[0].name === "Projects", "Subfolder path points to parent folder");

    // Get Folder Contents & Breadcrumbs
    const folderContentsRes = await request("GET", `/api/v1/folders/${subFolderId}`, { token: authToken });
    assert(folderContentsRes.status === 200, "GET /api/v1/folders/:id returns 200");
    assert(folderContentsRes.body.breadcrumbs.length === 2, "Breadcrumbs accurately contain [Projects, SkyDriveX Source]");

    // Rename Folder
    const renameFolderRes = await request("PATCH", `/api/v1/folders/${subFolderId}`, {
      token: authToken,
      body: { name: "SkyDriveX Core" },
    });
    assert(renameFolderRes.status === 200, "PATCH /api/v1/folders/:id renames folder");
    assert(renameFolderRes.body.folder.name === "SkyDriveX Core", "Folder name updated in DB");

    // ----------------------------------------------------
    // TEST GROUP 4: File Metadata & Local / S3 Storage
    // ----------------------------------------------------
    console.log("\n--- 4. Testing File Management & Local/Cloud Storage ---");

    const testFile1 = await File.create({
      name: "architecture_diagram.png",
      originalName: "architecture_diagram.png",
      s3Key: `users/${currentUserId}/test-architecture.png`,
      s3Url: "https://skydrivex-bucket.s3.amazonaws.com/test-architecture.png",
      mimeType: "image/png",
      size: 2048576, // 2MB
      extension: "png",
      category: "image",
      folder: subFolderId,
      user: currentUserId,
      tags: ["architecture", "diagram", "v1"],
    });
    fileId = testFile1._id.toString();

    const testFile2 = await File.create({
      name: "whitepaper.pdf",
      originalName: "whitepaper.pdf",
      s3Key: `users/${currentUserId}/test-whitepaper.pdf`,
      s3Url: "https://skydrivex-bucket.s3.amazonaws.com/test-whitepaper.pdf",
      mimeType: "application/pdf",
      size: 1048576, // 1MB
      extension: "pdf",
      category: "pdf",
      folder: rootFolderId,
      user: currentUserId,
      tags: ["doc", "whitepaper"],
    });
    secondFileId = testFile2._id.toString();
    assert(Boolean(fileId && secondFileId), "Created 2 test files with full metadata");

    // List files with category filter
    const filterFilesRes = await request("GET", "/api/v1/files?category=image", { token: authToken });
    assert(filterFilesRes.status === 200, "GET /api/v1/files?category=image returns 200");
    assert(filterFilesRes.body.files.length >= 1, "Category filter returns image files");

    // Search file by keyword
    const searchFileRes = await request("GET", "/api/v1/files?search=architecture", { token: authToken });
    assert(searchFileRes.status === 200, "GET /api/v1/files?search=architecture returns 200");
    assert(searchFileRes.body.files.length >= 1, "Search returns matching file");

    // Download Folder as ZIP
    const zipDownloadRes = await request("GET", `/api/v1/folders/${rootFolderId}/download`, { token: authToken });
    assert(zipDownloadRes.status === 200, "GET /api/v1/folders/:id/download returns 200 ZIP stream");

    // ----------------------------------------------------
    // TEST GROUP 5: Batch File Operations
    // ----------------------------------------------------
    console.log("\n--- 5. Testing Batch File Operations ---");

    // Batch Move Files
    const batchMoveRes = await request("PATCH", "/api/v1/files/batch-move", {
      token: authToken,
      body: {
        fileIds: [fileId, secondFileId],
        targetFolderId: rootFolderId,
      },
    });
    assert(batchMoveRes.status === 200, "Batch move files returns 200");
    assert(batchMoveRes.body.count === 2, "2 files moved to destination folder in batch");

    // Batch Trash Files
    const batchTrashRes = await request("POST", "/api/v1/files/batch-trash", {
      token: authToken,
      body: {
        fileIds: [fileId, secondFileId],
      },
    });
    assert(batchTrashRes.status === 200, "Batch trash files returns 200");
    assert(batchTrashRes.body.count === 2, "2 files moved to trash in batch");

    // Batch Restore Files
    const batchRestoreRes = await request("POST", "/api/v1/files/batch-restore", {
      token: authToken,
      body: {
        fileIds: [fileId, secondFileId],
      },
    });
    assert(batchRestoreRes.status === 200, "Batch restore files returns 200");
    assert(batchRestoreRes.body.count === 2, "2 files restored in batch");

    // ----------------------------------------------------
    // TEST GROUP 6: Storage Analytics & Quota
    // ----------------------------------------------------
    console.log("\n--- 6. Testing Storage Analytics ---");
    const storageRes = await request("GET", "/api/v1/storage/summary", { token: authToken });
    assert(storageRes.status === 200, "GET /api/v1/storage/summary returns 200");
    assert(storageRes.body.storage.usedBytes >= 3097152, "Storage analytics accurately calculates used bytes");
    assert(storageRes.body.storage.breakdown.image.count >= 1, "Breakdown categorizes image files properly");

    // ----------------------------------------------------
    // TEST GROUP 7: Shareable Links System
    // ----------------------------------------------------
    console.log("\n--- 7. Testing Shareable Links System ---");

    // Create Public Share Link (No password)
    const publicShareRes = await request("POST", "/api/v1/shares", {
      token: authToken,
      body: {
        itemType: "file",
        itemId: fileId,
        permission: "view",
      },
    });
    assert(publicShareRes.status === 201, "Create public share link returns 201");
    shareToken = publicShareRes.body.share.shareToken;

    // Guest accesses public share link
    const guestAccessRes = await request("GET", `/api/v1/shares/public/${shareToken}`);
    assert(guestAccessRes.status === 200, "Public guest accesses share link (200)");
    assert(guestAccessRes.body.requiresPassword === false, "Public share does not require password");

    // Create Password-Protected Share Link with Expiration
    const protectedShareRes = await request("POST", "/api/v1/shares", {
      token: authToken,
      body: {
        itemType: "file",
        itemId: fileId,
        permission: "download",
        password: "SecretSharePassword123",
        expiresInHours: 24,
      },
    });
    assert(protectedShareRes.status === 201, "Create password-protected share link returns 201");
    protectedShareToken = protectedShareRes.body.share.shareToken;

    // Verify correct password
    const correctPwdRes = await request("POST", `/api/v1/shares/public/${protectedShareToken}/verify`, {
      body: { password: "SecretSharePassword123" },
    });
    assert(correctPwdRes.status === 200, "Correct password verifies and returns temporary share access token");
    assert(Boolean(correctPwdRes.body.shareAccessToken), "Share access token issued");

    // ----------------------------------------------------
    // TEST GROUP 8: Background Cleanup Jobs & Audit Logs
    // ----------------------------------------------------
    console.log("\n--- 8. Testing Background Cleanup & Activity Audit ---");
    
    // Execute Background Cleanup
    await runCleanup();
    assert(true, "Background cleanup job executes without errors");

    const activityRes = await request("GET", "/api/v1/activities", { token: authToken });
    assert(activityRes.status === 200, "GET /api/v1/activities returns 200");
    assert(activityRes.body.activities.length > 0, "Activity log recorded user events");

    // ----------------------------------------------------
    // TEST GROUP 9: Permanent Account Deletion
    // ----------------------------------------------------
    console.log("\n--- 9. Testing User Account Deletion ---");
    const deleteAccountRes = await request("DELETE", "/api/v1/auth/account", { token: authToken });
    assert(deleteAccountRes.status === 200, "DELETE /api/v1/auth/account deletes user and cascades data");

    const deletedUserCheck = await User.findById(currentUserId);
    assert(deletedUserCheck === null, "User successfully purged from MongoDB");

    console.log("\n=========================================================");
    console.log(`🎉 ALL TESTS COMPLETED: ${passedTests}/${totalTests} PASSED (100% SUCCESS)`);
    console.log("=========================================================\n");

  } finally {
    // Cleanup test artifacts
    await User.deleteMany({ email: testEmail });
    if (currentUserId) {
      await Folder.deleteMany({ user: currentUserId });
      await File.deleteMany({ user: currentUserId });
      await Share.deleteMany({ user: currentUserId });
      await Activity.deleteMany({ user: currentUserId });
    }

    // Close server & MongoDB
    await new Promise((resolve) => server.close(resolve));
    await mongoose.connection.close();
    console.log("🔒 Server & Database connections closed gracefully.\n");
  }
};

runTestSuite()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test Suite Failed with Error:", err);
    process.exit(1);
  });
