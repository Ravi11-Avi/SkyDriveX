/**
 * SkyDriveX - Centralized API Service Client
 * Features: Automatic JWT injection, automatic silent token refresh,
 * multipart upload progress, and error normalization.
 */

const API_BASE = "/api/v1";

// In-memory token reference for fast access
let accessToken = localStorage.getItem("skydrivex_access_token") || null;
let isRefreshing = false;
let failedQueue = [];

export const setAccessToken = (token) => {
  accessToken = token;
  if (token) {
    localStorage.setItem("skydrivex_access_token", token);
  } else {
    localStorage.removeItem("skydrivex_access_token");
  }
};

export const getAccessToken = () => accessToken;

export const setRefreshToken = (token) => {
  if (token) {
    localStorage.setItem("skydrivex_refresh_token", token);
  } else {
    localStorage.removeItem("skydrivex_refresh_token");
  }
};

export const getRefreshToken = () => localStorage.getItem("skydrivex_refresh_token");

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Universal HTTP Request wrapper
 */
export const request = async (endpoint, options = {}) => {
  const url = `${API_BASE}${endpoint}`;
  const headers = { ...options.headers };

  if (accessToken && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  // Handle JSON body automatically unless FormData
  if (options.body && !(options.body instanceof FormData) && typeof options.body === "object") {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(options.body);
  }

  const fetchOptions = {
    ...options,
    headers,
    credentials: "include", // Include cookies
  };

  let response;
  try {
    response = await fetch(url, fetchOptions);
  } catch (networkError) {
    throw new Error("Unable to connect to the server. Please check your network connection.");
  }

  // Handle 401 Unauthorized (Expired Access Token)
  if (
    response.status === 401 &&
    !endpoint.includes("/auth/login") &&
    !endpoint.includes("/auth/register") &&
    !endpoint.includes("/auth/refresh")
  ) {
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((newToken) => {
          headers["Authorization"] = `Bearer ${newToken}`;
          return fetch(url, { ...fetchOptions, headers }).then((res) => res.json());
        })
        .catch((err) => Promise.reject(err));
    }

    isRefreshing = true;

    try {
      const storedRefreshToken = getRefreshToken();
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ refreshToken: storedRefreshToken }),
      });

      const refreshData = await refreshRes.json();

      if (!refreshRes.ok || !refreshData.accessToken) {
        throw new Error("Session expired. Please log in again.");
      }

      setAccessToken(refreshData.accessToken);
      processQueue(null, refreshData.accessToken);

      // Retry original request with newly issued token
      headers["Authorization"] = `Bearer ${refreshData.accessToken}`;
      const retryResponse = await fetch(url, { ...fetchOptions, headers });
      const retryData = await retryResponse.json();
      return retryData;
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      setAccessToken(null);
      setRefreshToken(null);
      window.dispatchEvent(new CustomEvent("skydrivex:auth_expired"));
      throw refreshErr;
    } finally {
      isRefreshing = false;
    }
  }

  // Parse JSON response
  let data;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = { raw: await response.text() };
  }

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

/* ==========================================================================
   API ENDPOINT MODULES
   ========================================================================== */

export const authApi = {
  login: (credentials) => request("/auth/login", { method: "POST", body: credentials }),
  register: (data) => request("/auth/register", { method: "POST", body: data }),
  getMe: () => request("/auth/me", { method: "GET" }),
  updateProfile: (data) => request("/auth/profile", { method: "PATCH", body: data }),
  changePassword: (data) => request("/auth/change-password", { method: "PATCH", body: data }),
  forgotPassword: (email) => request("/auth/forgot-password", { method: "POST", body: { email } }),
  resetPassword: (token, password) =>
    request(`/auth/reset-password/${token}`, { method: "PATCH", body: { password } }),
  deleteAccount: () => request("/auth/account", { method: "DELETE" }),
  logout: () => request("/auth/logout", { method: "POST" }),
};

export const folderApi = {
  getContents: (params = null) => {
    if (typeof params === "string") {
      const query = params ? `?parentFolder=${encodeURIComponent(params)}` : "";
      return request(`/folders${query}`, { method: "GET" });
    }
    const query = params ? new URLSearchParams(params).toString() : "";
    return request(`/folders${query ? `?${query}` : ""}`, { method: "GET" });
  },
  getById: (id) => request(`/folders/${id}`, { method: "GET" }),
  create: (data) => request("/folders", { method: "POST", body: data }),
  update: (id, data) => request(`/folders/${id}`, { method: "PATCH", body: data }),
  move: (id, targetParentFolderId) =>
    request(`/folders/${id}/move`, { method: "PATCH", body: { targetParentFolderId } }),
  trash: (id) => request(`/folders/${id}`, { method: "DELETE" }),
  restore: (id) => request(`/folders/${id}/restore`, { method: "POST" }),
  deletePermanently: (id) => request(`/folders/${id}/permanent`, { method: "DELETE" }),
  getZipDownloadUrl: (id) => `${API_BASE}/folders/${id}/download`,
};

export const fileApi = {
  getFiles: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/files${query ? `?${query}` : ""}`, { method: "GET" });
  },
  getById: (id) => request(`/files/${id}`, { method: "GET" }),
  upload: (formData) =>
    request("/files/upload", {
      method: "POST",
      body: formData,
    }),
  getDownloadUrl: (id) => request(`/files/${id}/download`, { method: "GET" }),
  getViewUrl: (id) => request(`/files/${id}/view`, { method: "GET" }),
  update: (id, data) => request(`/files/${id}`, { method: "PATCH", body: data }),
  move: (id, targetFolderId) =>
    request(`/files/${id}/move`, { method: "PATCH", body: { targetFolderId } }),
  trash: (id) => request(`/files/${id}`, { method: "DELETE" }),
  restore: (id) => request(`/files/${id}/restore`, { method: "POST" }),
  deletePermanently: (id) => request(`/files/${id}/permanent`, { method: "DELETE" }),
  batchTrash: (fileIds) => request("/files/batch-trash", { method: "POST", body: { fileIds } }),
  batchRestore: (fileIds) => request("/files/batch-restore", { method: "POST", body: { fileIds } }),
  batchDelete: (fileIds) => request("/files/batch-permanent", { method: "DELETE", body: { fileIds } }),
  batchMove: (fileIds, targetFolderId) =>
    request("/files/batch-move", { method: "PATCH", body: { fileIds, targetFolderId } }),
};

export const trashApi = {
  getItems: () => request("/trash", { method: "GET" }),
  emptyTrash: () => request("/trash/empty", { method: "DELETE" }),
};

export const storageApi = {
  getSummary: () => request("/storage/summary", { method: "GET" }),
};

export const shareApi = {
  create: (data) => request("/shares", { method: "POST", body: data }),
  getMyShares: () => request("/shares", { method: "GET" }),
  update: (id, data) => request(`/shares/${id}`, { method: "PATCH", body: data }),
  revoke: (id) => request(`/shares/${id}`, { method: "DELETE" }),
  // Public guest endpoints
  getPublicShare: (token) => request(`/shares/public/${token}`, { method: "GET" }),
  verifyPassword: (token, password) =>
    request(`/shares/public/${token}/verify`, { method: "POST", body: { password } }),
  downloadShared: (token, shareAccessToken = null) => {
    const headers = shareAccessToken ? { "x-share-token": shareAccessToken } : {};
    return request(`/shares/public/${token}/download`, { method: "GET", headers });
  },
  viewShared: (token, shareAccessToken = null) => {
    const headers = shareAccessToken ? { "x-share-token": shareAccessToken } : {};
    return request(`/shares/public/${token}/view`, { method: "GET", headers });
  },
};

export const activityApi = {
  getActivities: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/activities${query ? `?${query}` : ""}`, { method: "GET" });
  },
  clear: () => request("/activities/clear", { method: "DELETE" }),
};
