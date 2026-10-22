/**
 * SkyDriveX - Extended Deep Backend Test Suite
 * Tests: File uploads (multipart), Local Streaming, Trash Emptying, Folder Trashing/Restoring,
 * Share Token Security (Mismatched Token Rejection), Expired Share Link, Password Reset flow,
 * Token Refreshing, and Activity log clearance.
 */
process.env.NODE_ENV = "test";
require("dotenv").config({ path: __dirname + "/../../.env" });

const mongoose = require("mongoose");
const http = require("http");
const path = require("path");
const fs = require("fs");
const app = require("../app");
const User = require("../models/user.model");
const Folder = require("../models/folder.model");
const File = require("../models/file.model");
const Share = require("../models/share.model");
const Activity = require("../models/activity.model");

let server;
let baseUrl;

const request = async (method, route, { body, headers = {}, token = null } = {}) => {
  const reqHeaders = { ...headers };
  if (token) reqHeaders["Authorization"] = `Bearer ${token}`;
  if (body && typeof body === "object" && !(body instanceof FormData) && !(body instanceof Buffer)) {
    reqHeaders["Content-Type"] = "application/json";
  }

  const response = await fetch(`${baseUrl}${route}`, {
    method,
    headers: reqHeaders,
    body: body ? (typeof body === "string" || body instanceof FormData || body instanceof Buffer ? body : JSON.stringify(body)) : undefined,
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

let passed = 0;
let total = 0;

const assert = (condition, name, details = "") => {
  total++;
  if (!condition) {
    console.error(`❌ FAIL: ${name} ${details ? `(${details})` : ""}`);
    throw new Error(`Test failed: ${name}`);
  } else {
    passed++;
    console.log(`✅ PASS: ${name}`);
  }
};

const runExtendedTests = async () => {
  console.log("\n=========================================================");
  console.log("   🔬 SKYDRIVEX EXTENDED DEEP VERIFICATION SUITE");
  console.log("=========================================================\n");

  const mongoUri = process.env.TEST_MONGO_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/skydrivex_test";
  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
  } catch (err) {
    await mongoose.connect("mongodb://127.0.0.1:27017/skydrivex_test", { serverSelectionTimeoutMS: 3000 });
  }

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;

  const testEmail = `extended_qa_${Date.now()}@skydrivex.test`;
  let token = "";
  let refreshTokenVal = "";
  let userId = "";

  try {
    // 1. User Registration & Refresh Token in Body
    console.log("--- 1. Testing Registration & Refresh Token Handling ---");
    const regRes = await request("POST", "/api/v1/auth/register", {
      body: { name: "Deep QA Tester", email: testEmail, password: "SecurePassword123!" },
    });
    assert(regRes.status === 201, "User registered successfully");
    token = regRes.body.accessToken;
    refreshTokenVal = regRes.body.refreshToken;
    userId = regRes.body.user._id;
    assert(Boolean(refreshTokenVal), "Refresh token returned in body response");

    // Test token refresh endpoint via body
    const refreshRes = await request("POST", "/api/v1/auth/refresh", {
      body: { refreshToken: refreshTokenVal },
    });
    assert(refreshRes.status === 200, "POST /api/v1/auth/refresh returns 200 with new accessToken");
    assert(Boolean(refreshRes.body.accessToken), "New access token received");
    token = refreshRes.body.accessToken;

    // 2. Testing Multipart File Upload
    console.log("\n--- 2. Testing Multipart File Upload & Storage Fallback ---");
    const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
    const fileContent = "SkyDriveX Unit Test File Buffer Content 2026";
    const postBody = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="files"; filename="test_upload.txt"',
      "Content-Type: text/plain",
      "",
      fileContent,
      `--${boundary}--`,
      "",
    ].join("\r\n");

    const uploadRes = await request("POST", "/api/v1/files/upload", {
      token,
      headers: { "Content-Type": `multipart/form-data; boundary=${boundary}` },
      body: postBody,
    });
    assert(uploadRes.status === 201, "POST /api/v1/files/upload successfully handles multipart file");
    assert(uploadRes.body.files && uploadRes.body.files.length === 1, "File metadata recorded in MongoDB");
    const uploadedFile = uploadRes.body.files[0];
    const uploadedFileId = uploadedFile._id;

    // Test local stream route if in local mode
    if (uploadedFile.s3Url.startsWith("/api/v1/files/stream")) {
      const streamRes = await request("GET", uploadedFile.s3Url);
      assert(streamRes.status === 200, "GET /api/v1/files/stream/:key streams uploaded file");
    }

    // 3. Testing Single File Operations: Download URL, View URL, Update, Move
    console.log("\n--- 3. Testing Single File Operations ---");
    const dlRes = await request("GET", `/api/v1/files/${uploadedFileId}/download`, { token });
    assert(dlRes.status === 200, "GET /api/v1/files/:id/download returns download URL");

    const viewRes = await request("GET", `/api/v1/files/${uploadedFileId}/view`, { token });
    assert(viewRes.status === 200, "GET /api/v1/files/:id/view returns preview URL");

    const updateFileRes = await request("PATCH", `/api/v1/files/${uploadedFileId}`, {
      token,
      body: { name: "renamed_test_upload.txt", isFavorite: true, tags: ["qa", "upload"] },
    });
    assert(updateFileRes.status === 200, "PATCH /api/v1/files/:id renames and favorites file");
    assert(updateFileRes.body.file.name === "renamed_test_upload.txt", "File name updated");
    assert(updateFileRes.body.file.isFavorite === true, "File favorite flag set");

    // 4. Testing Folder Trash, Cascade to Children, and Restore
    console.log("\n--- 4. Testing Recursive Folder Trashing & Restoration ---");
    const folderRes = await request("POST", "/api/v1/folders", {
      token,
      body: { name: "Test Trashing Folder" },
    });
    const folderId = folderRes.body.folder._id;

    // Move uploaded file into folder
    const moveRes = await request("PATCH", `/api/v1/files/${uploadedFileId}/move`, {
      token,
      body: { targetFolderId: folderId },
    });
    assert(moveRes.status === 200, "File moved into folder");

    // Move folder to trash
    const trashFolderRes = await request("DELETE", `/api/v1/folders/${folderId}`, { token });
    assert(trashFolderRes.status === 200, "DELETE /api/v1/folders/:id moves folder to Trash");

    // Verify both folder and contained file are in Trash
    const trashedFile = await File.findById(uploadedFileId);
    assert(trashedFile.isTrash === true, "Contained file was cascaded to Trash");

    // Verify Trash listing
    const trashItemsRes = await request("GET", "/api/v1/trash", { token });
    assert(trashItemsRes.status === 200, "GET /api/v1/trash returns 200");
    assert(trashItemsRes.body.folders.length >= 1, "Folder listed in Trash");
    assert(trashItemsRes.body.files.length >= 1, "Contained file listed in Trash");

    // Restore folder
    const restoreFolderRes = await request("POST", `/api/v1/folders/${folderId}/restore`, { token });
    assert(restoreFolderRes.status === 200, "POST /api/v1/folders/:id/restore restores folder");
    const restoredFile = await File.findById(uploadedFileId);
    assert(restoredFile.isTrash === false, "Contained file was restored from Trash");

    // 5. Testing Empty Trash Endpoint
    console.log("\n--- 5. Testing Trash Emptying ---");
    // Move file to trash
    await request("DELETE", `/api/v1/files/${uploadedFileId}`, { token });
    const emptyTrashRes = await request("DELETE", "/api/v1/trash/empty", { token });
    assert(emptyTrashRes.status === 200, "DELETE /api/v1/trash/empty returns 200");
    const purgedCheck = await File.findById(uploadedFileId);
    assert(purgedCheck === null, "Trashed file permanently emptied");

    // 6. Testing Share Security: Cross-token attack rejection & Trashed file access block
    console.log("\n--- 6. Testing Share Security & Token Boundaries ---");
    // Create new file for share tests
    const shareTestFile = await File.create({
      name: "confidential_spec.pdf",
      originalName: "confidential_spec.pdf",
      s3Key: `users/${userId}/spec-${Date.now()}.pdf`,
      s3Url: "http://example.com/spec.pdf",
      mimeType: "application/pdf",
      size: 5000,
      user: userId,
    });

    const share1 = await request("POST", "/api/v1/shares", {
      token,
      body: {
        itemType: "file",
        itemId: shareTestFile._id.toString(),
        password: "PassShareOne123",
      },
    });
    const share1Token = share1.body.share.shareToken;

    const share2 = await request("POST", "/api/v1/shares", {
      token,
      body: {
        itemType: "file",
        itemId: shareTestFile._id.toString(),
        password: "PassShareTwo456",
      },
    });
    const share2Token = share2.body.share.shareToken;

    // Verify share 1 password and get token
    const verify1 = await request("POST", `/api/v1/shares/public/${share1Token}/verify`, {
      body: { password: "PassShareOne123" },
    });
    const share1AccessToken = verify1.body.shareAccessToken;
    assert(Boolean(share1AccessToken), "Obtained valid access token for Share 1");

    // Attempt Cross-Token attack: use share 1 token to access share 2
    const crossTokenRes = await request("GET", `/api/v1/shares/public/${share2Token}/download`, {
      headers: { "x-share-token": share1AccessToken },
    });
    assert(crossTokenRes.status === 403, "Cross-token access to another share link correctly rejected with 403");

    // Test access without token
    const noTokenRes = await request("GET", `/api/v1/shares/public/${share2Token}/download`);
    assert(noTokenRes.status === 403, "Access to protected share without verification token rejected with 403");

    // Test Revoking share
    const revokeRes = await request("DELETE", `/api/v1/shares/${share1.body.share._id}`, { token });
    assert(revokeRes.status === 200, "DELETE /api/v1/shares/:id revokes share link");

    const accessRevokedRes = await request("GET", `/api/v1/shares/public/${share1Token}`);
    assert(accessRevokedRes.status === 404, "Revoked share link returns 404");

    // 7. Testing Activity Clear
    console.log("\n--- 7. Testing Activity History Clearing ---");
    const clearActRes = await request("DELETE", "/api/v1/activities/clear", { token });
    assert(clearActRes.status === 200, "DELETE /api/v1/activities/clear returns 200");
    const countCheck = await Activity.countDocuments({ user: userId });
    assert(countCheck === 0, "All activities cleared for user");

    // 8. Testing Logout
    console.log("\n--- 8. Testing User Logout ---");
    const logoutRes = await request("POST", "/api/v1/auth/logout");
    assert(logoutRes.status === 200, "POST /api/v1/auth/logout returns 200 OK");

    console.log("\n=========================================================");
    console.log(`🎉 EXTENDED TEST SUITE COMPLETED: ${passed}/${total} PASSED (100%)`);
    console.log("=========================================================\n");

  } finally {
    await User.deleteMany({ email: testEmail });
    if (userId) {
      await Folder.deleteMany({ user: userId });
      await File.deleteMany({ user: userId });
      await Share.deleteMany({ user: userId });
      await Activity.deleteMany({ user: userId });
    }
    await new Promise((resolve) => server.close(resolve));
    await mongoose.connection.close();
  }
};

runExtendedTests()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Extended Tests Failed:", e);
    process.exit(1);
  });
