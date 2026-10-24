import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Cloud,
  Lock,
  Unlock,
  Download,
  Eye,
  FileText,
  Folder,
  AlertTriangle,
  Check,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowRight,
  HardDrive,
} from "lucide-react";
import { shareApi, folderApi } from "../services/api";

export default function PublicSharePage() {
  const { token } = useParams();

  const [loading, setLoading] = useState(true);
  const [shareData, setShareData] = useState(null);
  const [error, setError] = useState(null);

  // Password challenge state
  const [password, setPassword] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [shareAccessToken, setShareAccessToken] = useState(
    sessionStorage.getItem(`share_token_${token}`) || null
  );

  // File preview / media stream URL
  const [previewMediaUrl, setPreviewMediaUrl] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const fetchShareDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await shareApi.getPublicShare(token);

      if (res.success) {
        setShareData(res);

        // If not password protected and is a file, automatically fetch view URL
        if (!res.requiresPassword && res.itemType === "file") {
          fetchFileStream(null);
        }
      }
    } catch (err) {
      setError(err.message || "Failed to load shared item");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchFileStream = async (tokenOverride) => {
    try {
      const activeToken = tokenOverride || shareAccessToken;
      const res = await shareApi.viewShared(token, activeToken);
      if (res.success && res.viewUrl) {
        setPreviewMediaUrl(res.viewUrl);
      }
    } catch (e) {
      // Stream preview not available or not supported for this type
    }
  };

  useEffect(() => {
    fetchShareDetails();
  }, [fetchShareDetails]);

  const handleVerifyPassword = async (e) => {
    e.preventDefault();
    if (!password.trim()) return;

    try {
      setVerifying(true);
      setPasswordError("");
      const res = await shareApi.verifyPassword(token, password);

      if (res.success) {
        setShareAccessToken(res.shareAccessToken);
        sessionStorage.setItem(`share_token_${token}`, res.shareAccessToken);
        setShareData((prev) => ({
          ...prev,
          requiresPassword: false,
          item: res.item,
          subfolders: res.subfolders || [],
          files: res.files || [],
          permission: res.permission,
          itemType: res.itemType,
        }));

        if (res.itemType === "file") {
          fetchFileStream(res.shareAccessToken);
        }
      }
    } catch (err) {
      setPasswordError(err.message || "Incorrect password");
    } finally {
      setVerifying(false);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      if (shareData.itemType === "file") {
        const res = await shareApi.downloadShared(token, shareAccessToken);
        if (res.success && res.downloadUrl) {
          const a = document.createElement("a");
          a.href = res.downloadUrl;
          a.download = res.fileName || shareData.item?.originalName || "download";
          document.body.appendChild(a);
          a.click();
          a.remove();
        }
      } else {
        // Folder download as ZIP
        const zipUrl = folderApi.getZipDownloadUrl(shareData.item._id);
        window.open(zipUrl, "_blank");
      }
    } catch (err) {
      alert(err.message || "Failed to download item");
    } finally {
      setDownloading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return "--";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  if (loading) {
    return (
      <div className="public-share-page">
        <div className="glass-card public-share-card loading-box">
          <div className="loading-spinner"></div>
          <p>Decrypting shared resource...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="public-share-page">
        <div className="glass-card public-share-card error-box">
          <div className="error-icon-circle">
            <AlertTriangle size={36} />
          </div>
          <h2>Access Restricted</h2>
          <p>{error}</p>
          <Link to="/" className="btn btn-secondary" style={{ marginTop: "1rem" }}>
            Return to SkyDriveX
          </Link>
        </div>
      </div>
    );
  }

  const { requiresPassword, itemType, item, subfolders, files, permission } = shareData;

  return (
    <div className="public-share-page">
      {/* Background ambient lighting */}
      <div className="ambient-glow cyan-glow"></div>
      <div className="ambient-glow purple-glow"></div>

      {/* Top Navbar */}
      <header className="public-share-header">
        <Link to="/" className="brand-logo">
          <Cloud className="brand-icon" size={28} />
          <span className="brand-name">SkyDrive<span className="brand-x">X</span></span>
        </Link>
        <div className="security-pill">
          <ShieldCheck size={16} />
          <span>Encrypted Public Transfer</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="public-share-container">
        {requiresPassword ? (
          /* Password Form */
          <div className="glass-card public-share-card password-card">
            <div className="password-icon-wrap">
              <Lock size={32} />
            </div>
            <h2>Password Protected</h2>
            <p className="password-desc">
              The owner has protected this {itemType === "file" ? "file" : "folder"} with a security passcode. Enter it below to unlock.
            </p>

            {passwordError && (
              <div className="auth-error-banner">
                <AlertTriangle size={16} />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyPassword} className="password-form">
              <div className="form-group">
                <input
                  type="password"
                  className="form-input text-center"
                  placeholder="Enter security password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-block btn-lg"
                disabled={verifying || !password}
              >
                {verifying ? (
                  <>
                    <div className="loading-spinner mini"></div>
                    Verifying...
                  </>
                ) : (
                  <>
                    <Unlock size={18} />
                    Unlock Content
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Unlocked Content Card */
          <div className="glass-card public-share-card content-card">
            {/* Header info */}
            <div className="shared-item-header">
              <div className="shared-item-badge">
                {itemType === "folder" ? (
                  <Folder size={28} className="text-accent" />
                ) : (
                  <FileText size={28} className="text-cyan" />
                )}
              </div>
              <div className="shared-item-titles">
                <h2 className="shared-item-title">{item?.name || "Shared Item"}</h2>
                <div className="shared-item-meta">
                  {itemType === "file" && (
                    <>
                      <span>{formatFileSize(item?.size)}</span>
                      <span className="dot">•</span>
                      <span className="badge badge-secondary">{item?.category || "File"}</span>
                    </>
                  )}
                  {itemType === "folder" && (
                    <span>
                      Shared Folder ({(subfolders?.length || 0) + (files?.length || 0)} items inside)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Media Preview Box (Images/Videos/Audios) */}
            {itemType === "file" && previewMediaUrl && (
              <div className="media-preview-container">
                {item?.category === "image" && (
                  <img
                    src={previewMediaUrl}
                    alt={item.name}
                    className="shared-preview-img"
                  />
                )}
                {item?.category === "video" && (
                  <video
                    src={previewMediaUrl}
                    controls
                    className="shared-preview-video"
                  />
                )}
                {item?.category === "audio" && (
                  <div className="audio-player-card">
                    <audio src={previewMediaUrl} controls className="shared-preview-audio" />
                  </div>
                )}
              </div>
            )}

            {/* Folder Contents Explorer */}
            {itemType === "folder" && (
              <div className="shared-folder-contents">
                <h4>Folder Contents</h4>
                <div className="shared-items-list">
                  {subfolders?.map((sf) => (
                    <div key={sf._id} className="shared-subitem">
                      <Folder size={18} className="text-accent" />
                      <span className="subitem-name">{sf.name}</span>
                      <span className="badge badge-folder mini">Folder</span>
                    </div>
                  ))}
                  {files?.map((fl) => (
                    <div key={fl._id} className="shared-subitem">
                      <FileText size={18} className="text-secondary" />
                      <span className="subitem-name">{fl.name}</span>
                      <span className="subitem-size">{formatFileSize(fl.size)}</span>
                    </div>
                  ))}
                  {(!subfolders || subfolders.length === 0) &&
                    (!files || files.length === 0) && (
                      <p className="empty-subtext">This folder is currently empty.</p>
                    )}
                </div>
              </div>
            )}

            {/* Download Action Footer */}
            <div className="shared-actions-bar">
              {permission === "download" ? (
                <button
                  className="btn btn-primary btn-lg btn-download-hero"
                  onClick={handleDownload}
                  disabled={downloading}
                >
                  {downloading ? (
                    <>
                      <div className="loading-spinner mini"></div>
                      Preparing Download...
                    </>
                  ) : (
                    <>
                      <Download size={20} />
                      {itemType === "folder" ? "Download Folder as ZIP" : "Download File"}
                    </>
                  )}
                </button>
              ) : (
                <div className="view-only-notice">
                  <Eye size={18} />
                  <span>The owner has made this link View Only. Downloads are disabled.</span>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="public-share-footer">
        <p>
          Secure Cloud Storage Powered by{" "}
          <Link to="/" className="footer-link">SkyDriveX</Link>
        </p>
      </footer>
    </div>
  );
}
