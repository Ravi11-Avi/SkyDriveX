import React, { useState, useEffect, useCallback } from "react";
import {
  Share2,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  Lock,
  Unlock,
  Eye,
  Download,
  Calendar,
  Folder,
  FileText,
  RefreshCw,
  Power,
  Clock,
} from "lucide-react";
import { shareApi } from "../services/api";
import ConfirmModal from "../components/modals/ConfirmModal";

export default function SharesPage() {
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  const showToast = (message, type = "success") => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const loadShares = useCallback(async () => {
    try {
      setLoading(true);
      const res = await shareApi.getMyShares();
      if (res.success) {
        setShares(res.shares || []);
      }
    } catch (err) {
      showToast(err.message || "Failed to load shares", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShares();
  }, [loadShares]);

  const handleCopyLink = (share) => {
    const url = `${window.location.origin}/share/${share.token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(share._id);
    showToast("Share link copied to clipboard");
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleToggleActive = async (share) => {
    try {
      setProcessingId(share._id);
      const res = await shareApi.update(share._id, { isActive: !share.isActive });
      if (res.success) {
        setShares((prev) =>
          prev.map((s) => (s._id === share._id ? { ...s, isActive: !s.isActive } : s))
        );
        showToast(`Share link ${!share.isActive ? "activated" : "deactivated"}`);
      }
    } catch (err) {
      showToast(err.message || "Failed to update link status", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRevokeShare = (share) => {
    setConfirmModal({
      title: "Revoke Share Link?",
      message:
        "Anyone with this link will immediately lose access to the shared content. This link will be permanently destroyed.",
      confirmLabel: "Revoke Link",
      isDestructive: true,
      onConfirm: async () => {
        try {
          setProcessingId(share._id);
          await shareApi.revoke(share._id);
          setShares((prev) => prev.filter((s) => s._id !== share._id));
          showToast("Share link revoked permanently");
        } catch (err) {
          showToast(err.message || "Failed to revoke share", "error");
        } finally {
          setProcessingId(null);
          setConfirmModal(null);
        }
      },
    });
  };

  const isExpired = (expiresAt) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="dashboard-content">
      {/* Toast Feedback */}
      {feedback && (
        <div className={`floating-toast toast-${feedback.type}`}>
          {feedback.message}
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <div className="page-icon-badge cyan">
            <Share2 size={24} />
          </div>
          <div>
            <h1 className="page-title">Shared Links</h1>
            <p className="page-subtitle">
              Manage, monitor, and revoke your public and password-protected shareable links ({shares.length} active)
            </p>
          </div>
        </div>

        <div className="header-actions">
          <button
            className="btn btn-secondary btn-icon"
            onClick={loadShares}
            title="Refresh links"
          >
            <RefreshCw size={17} className={loading ? "spin" : ""} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading your shared links...</p>
        </div>
      ) : shares.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon-wrap cyan">
            <Share2 size={44} />
          </div>
          <h3>No shared links yet</h3>
          <p>
            You haven't generated any share links. Select any file or folder from your drive and click "Share" to create one.
          </p>
        </div>
      ) : (
        <div className="shares-table-container">
          <table className="files-table">
            <thead>
              <tr>
                <th>Shared Item</th>
                <th>Security</th>
                <th>Permission</th>
                <th>Status</th>
                <th>Expires</th>
                <th>Stats</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shares.map((share) => {
                const expired = isExpired(share.expiresAt);
                const itemName = share.item?.name || "Shared Item";
                const isFolder = share.itemType === "folder";

                return (
                  <tr key={share._id} className="table-row">
                    <td>
                      <div className="row-item-info">
                        <div
                          className="folder-icon-circle mini"
                          style={{
                            backgroundColor: isFolder
                              ? "rgba(99, 102, 241, 0.15)"
                              : "rgba(56, 189, 248, 0.15)",
                            color: isFolder ? "#818cf8" : "#38bdf8",
                          }}
                        >
                          {isFolder ? <Folder size={18} /> : <FileText size={18} />}
                        </div>
                        <div>
                          <span className="row-item-name font-medium">{itemName}</span>
                          <div className="share-token-sub">
                            <span>/share/{share.token.slice(0, 10)}...</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      {share.isPasswordProtected ? (
                        <span className="badge badge-warning flex-center gap-1">
                          <Lock size={12} /> Password
                        </span>
                      ) : (
                        <span className="badge badge-secondary flex-center gap-1">
                          <Unlock size={12} /> Public
                        </span>
                      )}
                    </td>

                    <td>
                      <span className="badge badge-primary">
                        {share.permission === "download" ? "Download" : "View Only"}
                      </span>
                    </td>

                    <td>
                      {expired ? (
                        <span className="badge badge-danger">Expired</span>
                      ) : share.isActive ? (
                        <span className="badge badge-success">Active</span>
                      ) : (
                        <span className="badge badge-secondary">Disabled</span>
                      )}
                    </td>

                    <td className="text-secondary text-sm">
                      <div className="flex-center gap-1">
                        <Calendar size={13} />
                        {formatDate(share.expiresAt)}
                      </div>
                    </td>

                    <td>
                      <div className="share-stats-pills">
                        <span title="Views" className="stat-pill">
                          <Eye size={13} /> {share.views || 0}
                        </span>
                        <span title="Downloads" className="stat-pill">
                          <Download size={13} /> {share.downloads || 0}
                        </span>
                      </div>
                    </td>

                    <td className="text-right">
                      <div className="row-actions">
                        <button
                          className="btn-action-round copy"
                          onClick={() => handleCopyLink(share)}
                          title="Copy Link"
                        >
                          {copiedId === share._id ? (
                            <Check size={16} className="text-success" />
                          ) : (
                            <Copy size={16} />
                          )}
                        </button>

                        <a
                          href={`/share/${share.token}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-action-round link"
                          title="Open public page"
                        >
                          <ExternalLink size={16} />
                        </a>

                        <button
                          className={`btn-action-round power ${share.isActive ? "active" : ""}`}
                          onClick={() => handleToggleActive(share)}
                          title={share.isActive ? "Disable Link" : "Enable Link"}
                          disabled={processingId === share._id}
                        >
                          <Power size={16} />
                        </button>

                        <button
                          className="btn-action-round delete"
                          onClick={() => handleRevokeShare(share)}
                          title="Revoke Share Link"
                          disabled={processingId === share._id}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <ConfirmModal
          isOpen={true}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmLabel={confirmModal.confirmLabel}
          isDestructive={confirmModal.isDestructive}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
}
