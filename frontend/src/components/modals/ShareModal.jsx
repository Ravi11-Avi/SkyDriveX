import React, { useState } from "react";
import { Share2, X, Copy, Check, Lock, Clock, Eye, Download, Shield } from "lucide-react";
import { shareApi } from "../../services/api";

export const ShareModal = ({ isOpen, onClose, item, itemType = "file" }) => {
  const [permission, setPermission] = useState("view");
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [password, setPassword] = useState("");
  const [expiresInHours, setExpiresInHours] = useState("");
  const [createdShare, setCreatedShare] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !item) return null;

  const handleCreateShare = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        itemType,
        itemId: item._id,
        permission,
      };

      if (isPasswordProtected && password) {
        payload.password = password;
      }

      if (expiresInHours) {
        payload.expiresInHours = parseInt(expiresInHours, 10);
      }

      const res = await shareApi.create(payload);
      if (res.success && res.share) {
        setCreatedShare(res.share);
      }
    } catch (err) {
      setError(err.message || "Failed to create share link");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (createdShare?.shareUrl) {
      navigator.clipboard.writeText(createdShare.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleModalClose = () => {
    setCreatedShare(null);
    setCopied(false);
    setPassword("");
    setIsPasswordProtected(false);
    setExpiresInHours("");
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleModalClose}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-with-icon">
            <div className="modal-header-icon primary-accent">
              <Share2 size={20} />
            </div>
            <h3>Share "{item.name}"</h3>
          </div>
          <button className="btn-icon" onClick={handleModalClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {error && <div className="alert-error-box">{error}</div>}

          {createdShare ? (
            <div className="share-success-container">
              <div className="share-success-icon">
                <Check size={32} />
              </div>
              <h4>Share Link Generated!</h4>
              <p>Anyone with this link can {createdShare.permission} this {itemType}.</p>

              <div className="share-url-box">
                <input
                  type="text"
                  readOnly
                  className="share-url-input"
                  value={createdShare.shareUrl}
                />
                <button
                  type="button"
                  className={`btn ${copied ? "btn-success" : "btn-primary"} btn-copy-link`}
                  onClick={copyToClipboard}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  <span>{copied ? "Copied!" : "Copy Link"}</span>
                </button>
              </div>

              {createdShare.isPasswordProtected && (
                <div className="share-meta-badge">
                  <Lock size={14} /> Password protected
                </div>
              )}
              {createdShare.expiresAt && (
                <div className="share-meta-badge">
                  <Clock size={14} /> Expires: {new Date(createdShare.expiresAt).toLocaleDateString()}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleCreateShare}>
              {/* Permission Selector */}
              <div className="input-group">
                <label className="input-label">Permission</label>
                <div className="permission-toggle-group">
                  <button
                    type="button"
                    className={`permission-btn ${permission === "view" ? "active" : ""}`}
                    onClick={() => setPermission("view")}
                  >
                    <Eye size={16} />
                    <span>View Only</span>
                  </button>
                  <button
                    type="button"
                    className={`permission-btn ${permission === "download" ? "active" : ""}`}
                    onClick={() => setPermission("download")}
                  >
                    <Download size={16} />
                    <span>Allow Download</span>
                  </button>
                </div>
              </div>

              {/* Password Protection */}
              <div className="input-group">
                <div className="checkbox-row" onClick={() => setIsPasswordProtected(!isPasswordProtected)}>
                  <input
                    type="checkbox"
                    checked={isPasswordProtected}
                    onChange={(e) => setIsPasswordProtected(e.target.checked)}
                  />
                  <div className="checkbox-label-content">
                    <span className="checkbox-title">Password Protection</span>
                    <span className="checkbox-desc">Require visitors to enter a password to open this link</span>
                  </div>
                </div>

                {isPasswordProtected && (
                  <div className="conditional-input-box">
                    <input
                      type="password"
                      className="input-field"
                      placeholder="Enter minimum 4-character password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required={isPasswordProtected}
                      minLength={4}
                    />
                  </div>
                )}
              </div>

              {/* Expiration Hours */}
              <div className="input-group">
                <label className="input-label">Link Expiration (Optional)</label>
                <select
                  className="input-field"
                  value={expiresInHours}
                  onChange={(e) => setExpiresInHours(e.target.value)}
                >
                  <option value="">Never Expires</option>
                  <option value="1">Expires in 1 Hour</option>
                  <option value="24">Expires in 24 Hours (1 Day)</option>
                  <option value="168">Expires in 7 Days</option>
                  <option value="720">Expires in 30 Days</option>
                </select>
              </div>

              <div className="modal-footer" style={{ margin: "1.5rem -1.5rem -1.5rem -1.5rem" }}>
                <button type="button" className="btn btn-secondary" onClick={handleModalClose}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Generating..." : "Create Share Link"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
