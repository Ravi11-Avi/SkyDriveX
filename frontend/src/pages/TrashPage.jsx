import React, { useState, useEffect, useCallback } from "react";
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  Folder,
  FileText,
  RefreshCw,
  HardDrive,
  Info,
} from "lucide-react";
import { trashApi, folderApi, fileApi } from "../services/api";
import ConfirmModal from "../components/modals/ConfirmModal";

export default function TrashPage() {
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  const showToast = (message, type = "success") => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const loadTrash = useCallback(async () => {
    try {
      setLoading(true);
      const res = await trashApi.getItems();
      if (res.success) {
        setFolders(res.folders || []);
        setFiles(res.files || []);
      }
    } catch (err) {
      showToast(err.message || "Failed to load trash items", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrash();
  }, [loadTrash]);

  const handleRestoreFolder = async (folder) => {
    try {
      setProcessingId(folder._id);
      await folderApi.restore(folder._id);
      setFolders((prev) => prev.filter((f) => f._id !== folder._id));
      showToast(`Restored folder "${folder.name}"`);
    } catch (err) {
      showToast(err.message || "Failed to restore folder", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRestoreFile = async (file) => {
    try {
      setProcessingId(file._id);
      await fileApi.restore(file._id);
      setFiles((prev) => prev.filter((f) => f._id !== file._id));
      showToast(`Restored "${file.name}"`);
    } catch (err) {
      showToast(err.message || "Failed to restore file", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteFolderPermanently = (folder) => {
    setConfirmModal({
      title: "Permanently Delete Folder?",
      message: `Are you sure you want to permanently delete "${folder.name}" and all of its contents? This action CANNOT be undone.`,
      confirmLabel: "Delete Forever",
      isDestructive: true,
      onConfirm: async () => {
        try {
          setProcessingId(folder._id);
          await folderApi.deletePermanently(folder._id);
          setFolders((prev) => prev.filter((f) => f._id !== folder._id));
          showToast(`Permanently deleted folder "${folder.name}"`);
        } catch (err) {
          showToast(err.message || "Failed to delete folder", "error");
        } finally {
          setProcessingId(null);
          setConfirmModal(null);
        }
      },
    });
  };

  const handleDeleteFilePermanently = (file) => {
    setConfirmModal({
      title: "Permanently Delete File?",
      message: `Are you sure you want to permanently delete "${file.name}"? This file will be removed from Cloud Storage immediately.`,
      confirmLabel: "Delete Forever",
      isDestructive: true,
      onConfirm: async () => {
        try {
          setProcessingId(file._id);
          await fileApi.deletePermanently(file._id);
          setFiles((prev) => prev.filter((f) => f._id !== file._id));
          showToast(`Permanently deleted "${file.name}"`);
        } catch (err) {
          showToast(err.message || "Failed to delete file", "error");
        } finally {
          setProcessingId(null);
          setConfirmModal(null);
        }
      },
    });
  };

  const handleEmptyTrash = () => {
    setConfirmModal({
      title: "Empty Trash Completely?",
      message:
        "All folders and files currently in your trash will be permanently wiped from SkyDriveX and cloud storage. Are you absolutely certain?",
      confirmLabel: "Empty Trash",
      isDestructive: true,
      onConfirm: async () => {
        try {
          await trashApi.emptyTrash();
          setFolders([]);
          setFiles([]);
          showToast("Trash has been emptied");
        } catch (err) {
          showToast(err.message || "Failed to empty trash", "error");
        } finally {
          setConfirmModal(null);
        }
      },
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return "--";
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
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalCount = folders.length + files.length;

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
          <div className="page-icon-badge danger">
            <Trash2 size={24} />
          </div>
          <div>
            <h1 className="page-title">Trash</h1>
            <p className="page-subtitle">
              Items in Trash are scheduled for permanent purge after 30 days ({totalCount} items)
            </p>
          </div>
        </div>

        <div className="header-actions">
          <button
            className="btn btn-secondary btn-icon"
            onClick={loadTrash}
            title="Refresh Trash"
          >
            <RefreshCw size={17} className={loading ? "spin" : ""} />
          </button>
          {totalCount > 0 && (
            <button
              className="btn btn-danger"
              onClick={handleEmptyTrash}
              disabled={loading}
            >
              <Trash2 size={16} />
              Empty Trash
            </button>
          )}
        </div>
      </div>

      {/* Informational Banner */}
      <div className="glass-card banner-card" style={{ marginBottom: "1.5rem" }}>
        <div className="banner-icon">
          <Info size={20} />
        </div>
        <div className="banner-text">
          <strong>Automatic Retention Policy:</strong> Trashed items remain safely recoverable for 30 days. You can restore them back to their original locations or purge them immediately to free up space.
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading trash items...</p>
        </div>
      ) : totalCount === 0 ? (
        <div className="empty-state">
          <div className="empty-icon-wrap danger">
            <Trash2 size={44} />
          </div>
          <h3>Trash is empty</h3>
          <p>Items you delete from your drive will appear here before being permanently removed.</p>
        </div>
      ) : (
        <div className="trash-items-wrapper">
          <div className="files-table-container">
            <table className="files-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Trashed Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Trashed Folders */}
                {folders.map((folder) => (
                  <tr key={folder._id} className="table-row">
                    <td>
                      <div className="row-item-info">
                        <div
                          className="folder-icon-circle mini"
                          style={{
                            background: folder.color
                              ? `${folder.color}25`
                              : "rgba(99, 102, 241, 0.2)",
                            color: folder.color || "#6366f1",
                          }}
                        >
                          <Folder size={18} fill="currentColor" />
                        </div>
                        <span className="row-item-name font-semibold">
                          {folder.name}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-folder">Folder</span>
                    </td>
                    <td>--</td>
                    <td className="text-secondary text-sm">
                      {formatDate(folder.trashedAt || folder.updatedAt)}
                    </td>
                    <td className="text-right">
                      <div className="row-actions">
                        <button
                          className="btn-action-round restore"
                          onClick={() => handleRestoreFolder(folder)}
                          title="Restore folder"
                          disabled={processingId === folder._id}
                        >
                          <RotateCcw size={16} />
                        </button>
                        <button
                          className="btn-action-round delete"
                          onClick={() => handleDeleteFolderPermanently(folder)}
                          title="Delete permanently"
                          disabled={processingId === folder._id}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Trashed Files */}
                {files.map((file) => (
                  <tr key={file._id} className="table-row">
                    <td>
                      <div className="row-item-info">
                        <div className={`file-icon-square mini ${file.category}`}>
                          <FileText size={18} />
                        </div>
                        <span className="row-item-name">
                          {file.name}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${file.category || "other"}`}>
                        {file.category || "File"}
                      </span>
                    </td>
                    <td className="text-secondary text-sm">
                      {formatFileSize(file.size)}
                    </td>
                    <td className="text-secondary text-sm">
                      {formatDate(file.trashedAt || file.updatedAt)}
                    </td>
                    <td className="text-right">
                      <div className="row-actions">
                        <button
                          className="btn-action-round restore"
                          onClick={() => handleRestoreFile(file)}
                          title="Restore file"
                          disabled={processingId === file._id}
                        >
                          <RotateCcw size={16} />
                        </button>
                        <button
                          className="btn-action-round delete"
                          onClick={() => handleDeleteFilePermanently(file)}
                          title="Delete permanently"
                          disabled={processingId === file._id}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
