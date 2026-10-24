import React, { useState, useEffect, useCallback } from "react";
import {
  HardDrive,
  Image,
  Video,
  Music,
  FileText,
  Code,
  Archive,
  Layers,
  History,
  Trash2,
  RefreshCw,
  Clock,
  ShieldCheck,
  Activity,
  AlertCircle,
} from "lucide-react";
import { storageApi, activityApi } from "../services/api";
import ConfirmModal from "../components/modals/ConfirmModal";

const CATEGORY_META = {
  image: { label: "Images", icon: Image, color: "#38bdf8" },
  video: { label: "Videos", icon: Video, color: "#f43f5e" },
  audio: { label: "Audio", icon: Music, color: "#a855f7" },
  document: { label: "Documents", icon: FileText, color: "#3b82f6" },
  code: { label: "Code Files", icon: Code, color: "#10b981" },
  archive: { label: "Archives", icon: Archive, color: "#f59e0b" },
  other: { label: "Others", icon: Layers, color: "#64748b" },
};

export default function StoragePage() {
  const [summary, setSummary] = useState(null);
  const [activities, setActivities] = useState([]);
  const [activityTotal, setActivityTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);

  const showToast = (message, type = "success") => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const loadStorageData = useCallback(async () => {
    try {
      setLoading(true);
      const [storageRes, activityRes] = await Promise.all([
        storageApi.getSummary(),
        activityApi.getActivities({ page: 1, limit: 15 }),
      ]);

      if (storageRes.success) {
        setSummary(storageRes.summary);
      }
      if (activityRes.success) {
        setActivities(activityRes.activities || []);
        setActivityTotal(activityRes.total || 0);
      }
    } catch (err) {
      showToast(err.message || "Failed to load storage and activity data", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStorageData();
  }, [loadStorageData]);

  const loadMoreActivities = async (newPage) => {
    try {
      setActivityLoading(true);
      const res = await activityApi.getActivities({ page: newPage, limit: 15 });
      if (res.success) {
        setActivities(res.activities || []);
        setPage(newPage);
      }
    } catch (err) {
      showToast(err.message || "Failed to load activities", "error");
    } finally {
      setActivityLoading(false);
    }
  };

  const handleClearActivities = () => {
    setConfirmModal({
      title: "Clear Activity Audit Log?",
      message:
        "This will permanently erase your recent activity audit logs from the system. Your files and folders will remain unaffected.",
      confirmLabel: "Clear Log",
      isDestructive: true,
      onConfirm: async () => {
        try {
          await activityApi.clear();
          setActivities([]);
          setActivityTotal(0);
          showToast("Activity history cleared");
        } catch (err) {
          showToast(err.message || "Failed to clear history", "error");
        } finally {
          setConfirmModal(null);
        }
      },
    });
  };

  const formatBytes = (bytes) => {
    if (!bytes && bytes !== 0) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "--";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const used = summary?.usedStorage || 0;
  const limit = summary?.storageLimit || 5 * 1024 * 1024 * 1024;
  const percent = summary?.percentageUsed ? parseFloat(summary.percentageUsed) : ((used / limit) * 100);

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
          <div className="page-icon-badge purple">
            <HardDrive size={24} />
          </div>
          <div>
            <h1 className="page-title">Storage & Audit</h1>
            <p className="page-subtitle">
              Manage your drive quota and inspect real-time security activity logs
            </p>
          </div>
        </div>

        <div className="header-actions">
          <button
            className="btn btn-secondary btn-icon"
            onClick={loadStorageData}
            title="Refresh analytics"
          >
            <RefreshCw size={17} className={loading ? "spin" : ""} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Analyzing storage allocation...</p>
        </div>
      ) : (
        <div className="storage-analytics-layout">
          {/* Main Quota Card */}
          <div className="glass-card storage-main-card">
            <div className="storage-main-header">
              <div>
                <span className="text-secondary text-sm uppercase tracking-wide">
                  Storage Allocation
                </span>
                <h2 className="storage-large-num">
                  {formatBytes(used)}{" "}
                  <span className="storage-limit-sub">/ {formatBytes(limit)}</span>
                </h2>
              </div>
              <div className="storage-percent-pill">
                <span className="percent-val">{percent.toFixed(1)}%</span>
                <span className="percent-sub">used</span>
              </div>
            </div>

            {/* Segmented Progress Bar */}
            <div className="storage-bar-multi">
              {summary?.categories &&
                Object.entries(summary.categories).map(([catKey, data]) => {
                  const catSize = data.size || 0;
                  const catPercent = (catSize / limit) * 100;
                  if (catPercent < 0.2) return null;
                  const meta = CATEGORY_META[catKey] || CATEGORY_META.other;
                  return (
                    <div
                      key={catKey}
                      className="storage-bar-segment"
                      style={{
                        width: `${catPercent}%`,
                        backgroundColor: meta.color,
                      }}
                      title={`${meta.label}: ${formatBytes(catSize)} (${catPercent.toFixed(1)}%)`}
                    />
                  );
                })}
            </div>

            <div className="storage-meta-hint">
              <ShieldCheck size={16} className="text-success" />
              <span>
                Zero-knowledge encrypted cloud storage. Backed up with automated replication.
              </span>
            </div>
          </div>

          {/* Category Breakdown Grid */}
          <div className="storage-categories-grid">
            {summary?.categories &&
              Object.entries(summary.categories).map(([catKey, data]) => {
                const meta = CATEGORY_META[catKey] || CATEGORY_META.other;
                const IconComponent = meta.icon;
                const catSize = data.size || 0;
                const catCount = data.count || 0;
                const catPercent = used > 0 ? ((catSize / used) * 100).toFixed(1) : 0;

                return (
                  <div key={catKey} className="glass-card storage-category-card">
                    <div className="cat-card-header">
                      <div
                        className="cat-icon-wrap"
                        style={{
                          backgroundColor: `${meta.color}20`,
                          color: meta.color,
                        }}
                      >
                        <IconComponent size={20} />
                      </div>
                      <span className="cat-percent-tag">{catPercent}%</span>
                    </div>
                    <div className="cat-card-body">
                      <h4 className="cat-title">{meta.label}</h4>
                      <p className="cat-size-str">{formatBytes(catSize)}</p>
                      <span className="cat-count-sub">{catCount} files</span>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Security & Audit Activity Log */}
          <div className="glass-card activity-section">
            <div className="activity-section-header">
              <div className="activity-title-group">
                <Activity size={20} className="text-accent" />
                <h3>Activity Audit Log</h3>
                <span className="badge badge-secondary">{activityTotal} events</span>
              </div>
              {activities.length > 0 && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleClearActivities}
                >
                  <Trash2 size={14} />
                  Clear History
                </button>
              )}
            </div>

            {activities.length === 0 ? (
              <div className="empty-substate">
                <Clock size={32} className="text-secondary" />
                <p>No activity logs recorded yet.</p>
              </div>
            ) : (
              <div className="activity-table-wrap">
                <table className="activity-table">
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Target</th>
                      <th>Timestamp</th>
                      <th>IP Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities.map((act) => (
                      <tr key={act._id}>
                        <td>
                          <span className={`badge-action badge-${act.action.toLowerCase()}`}>
                            {act.action.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td>
                          <span className="activity-target font-medium">
                            {act.itemName || act.details?.name || "--"}
                          </span>
                        </td>
                        <td className="text-secondary text-sm">
                          {formatDate(act.createdAt)}
                        </td>
                        <td className="text-secondary text-mono text-sm">
                          {act.ipAddress || "127.0.0.1"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
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
