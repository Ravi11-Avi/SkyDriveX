import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Folder, FileText, RefreshCw } from "lucide-react";
import { folderApi, fileApi } from "../services/api";
import FolderCard from "../components/drive/FolderCard";
import FileCard from "../components/drive/FileCard";
import FileListRow from "../components/drive/FileListRow";
import ShareModal from "../components/modals/ShareModal";
import FilePreviewModal from "../components/modals/FilePreviewModal";
import MoveItemModal from "../components/modals/MoveItemModal";
import ConfirmModal from "../components/modals/ConfirmModal";

export default function FavoritesPage() {
  const navigate = useNavigate();
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [feedback, setFeedback] = useState(null);

  // Modals state
  const [shareItem, setShareItem] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [moveItem, setMoveItem] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);

  const showToast = (message, type = "success") => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const loadFavorites = useCallback(async () => {
    try {
      setLoading(true);
      const res = await folderApi.getContents({ isFavorite: "true" });
      if (res.success) {
        setFolders(res.folders || []);
        setFiles(res.files || []);
      }
    } catch (err) {
      showToast(err.message || "Failed to load favorites", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const handleToggleFavoriteFolder = async (folder) => {
    try {
      await folderApi.update(folder._id, { isFavorite: !folder.isFavorite });
      setFolders((prev) => prev.filter((f) => f._id !== folder._id));
      showToast("Removed from favorites");
    } catch (err) {
      showToast(err.message || "Failed to update favorite status", "error");
    }
  };

  const handleToggleFavoriteFile = async (file) => {
    try {
      await fileApi.update(file._id, { isFavorite: !file.isFavorite });
      setFiles((prev) => prev.filter((f) => f._id !== file._id));
      showToast("Removed from favorites");
    } catch (err) {
      showToast(err.message || "Failed to update favorite status", "error");
    }
  };

  const handleTrashFolder = (folder) => {
    setConfirmModal({
      title: "Move to Trash?",
      message: `Are you sure you want to move folder "${folder.name}" to Trash?`,
      confirmLabel: "Move to Trash",
      isDestructive: true,
      onConfirm: async () => {
        try {
          await folderApi.trash(folder._id);
          setFolders((prev) => prev.filter((f) => f._id !== folder._id));
          showToast(`Moved "${folder.name}" to Trash`);
        } catch (err) {
          showToast(err.message || "Failed to trash folder", "error");
        } finally {
          setConfirmModal(null);
        }
      },
    });
  };

  const handleTrashFile = (file) => {
    setConfirmModal({
      title: "Move to Trash?",
      message: `Are you sure you want to move "${file.name}" to Trash?`,
      confirmLabel: "Move to Trash",
      isDestructive: true,
      onConfirm: async () => {
        try {
          await fileApi.trash(file._id);
          setFiles((prev) => prev.filter((f) => f._id !== file._id));
          showToast(`Moved "${file.name}" to Trash`);
        } catch (err) {
          showToast(err.message || "Failed to trash file", "error");
        } finally {
          setConfirmModal(null);
        }
      },
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
          <div className="page-icon-badge gold">
            <Star size={24} className="star-filled" />
          </div>
          <div>
            <h1 className="page-title">Favorites</h1>
            <p className="page-subtitle">
              Quick access to your starred files and folders ({totalCount} items)
            </p>
          </div>
        </div>

        <div className="header-actions">
          <button
            className="btn btn-secondary btn-icon"
            onClick={loadFavorites}
            title="Refresh"
          >
            <RefreshCw size={17} className={loading ? "spin" : ""} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading your favorite items...</p>
        </div>
      ) : totalCount === 0 ? (
        <div className="empty-state">
          <div className="empty-icon-wrap gold">
            <Star size={44} />
          </div>
          <h3>No favorite items yet</h3>
          <p>
            Star any important file or folder from your drive to quickly access it here anytime.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/")}
            style={{ marginTop: "1rem" }}
          >
            Browse My Drive
          </button>
        </div>
      ) : (
        <div className="drive-sections">
          {/* Folders Section */}
          {folders.length > 0 && (
            <section className="drive-section">
              <div className="section-header">
                <h2>Starred Folders ({folders.length})</h2>
              </div>
              <div className="folders-grid">
                {folders.map((folder) => (
                  <FolderCard
                    key={folder._id}
                    folder={folder}
                    onOpen={() => navigate(`/folder/${folder._id}`)}
                    onRename={() => {}}
                    onShare={(f) => setShareItem({ type: "folder", item: f })}
                    onMove={(f) => setMoveItem({ type: "folder", item: f })}
                    onTrash={handleTrashFolder}
                    onToggleFavorite={handleToggleFavoriteFolder}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Files Section */}
          {files.length > 0 && (
            <section className="drive-section">
              <div className="section-header">
                <h2>Starred Files ({files.length})</h2>
              </div>

              {viewMode === "grid" ? (
                <div className="files-grid">
                  {files.map((file) => (
                    <FileCard
                      key={file._id}
                      file={file}
                      onPreview={(f) => setPreviewFile(f)}
                      onDownload={() => {}}
                      onShare={(f) => setShareItem({ type: "file", item: f })}
                      onRename={() => {}}
                      onMove={(f) => setMoveItem({ type: "file", item: f })}
                      onTrash={handleTrashFile}
                      onToggleFavorite={handleToggleFavoriteFile}
                    />
                  ))}
                </div>
              ) : (
                <div className="files-table-container">
                  <table className="files-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Size</th>
                        <th>Modified</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {files.map((file) => (
                        <FileListRow
                          key={file._id}
                          file={file}
                          onPreview={(f) => setPreviewFile(f)}
                          onDownload={() => {}}
                          onShare={(f) => setShareItem({ type: "file", item: f })}
                          onRename={() => {}}
                          onMove={(f) => setMoveItem({ type: "file", item: f })}
                          onTrash={handleTrashFile}
                          onToggleFavorite={handleToggleFavoriteFile}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {/* Share Modal */}
      {shareItem && (
        <ShareModal
          item={shareItem.item}
          itemType={shareItem.type}
          onClose={() => setShareItem(null)}
          onSuccess={() => {
            showToast("Share link created successfully");
          }}
        />
      )}

      {/* Preview Modal */}
      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
          onDownload={() => {}}
          onShare={(f) => setShareItem({ type: "file", item: f })}
        />
      )}

      {/* Move Item Modal */}
      {moveItem && (
        <MoveItemModal
          item={moveItem.item}
          itemType={moveItem.type}
          onClose={() => setMoveItem(null)}
          onSuccess={() => {
            loadFavorites();
            showToast(`Moved ${moveItem.type} successfully`);
          }}
        />
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
