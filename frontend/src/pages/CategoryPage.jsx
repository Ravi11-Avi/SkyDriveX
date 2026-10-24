import React, { useState, useEffect } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { fileApi } from "../services/api";
import { FileCard, getCategoryIcon } from "../components/drive/FileCard";
import { FileListRow } from "../components/drive/FileListRow";
import { ConfirmModal } from "../components/modals/ConfirmModal";

export const CategoryPage = () => {
  const { category } = useParams();
  const {
    viewMode,
    searchQuery,
    openPreview,
    openShare,
    openMove,
    openUpload,
    refreshTrigger,
    triggerRefresh,
  } = useOutletContext();

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadCategoryFiles = async () => {
    setLoading(true);
    setError("");
    try {
      const params = { category };
      if (searchQuery) params.search = searchQuery;
      const res = await fileApi.getFiles(params);
      if (res.success) {
        setFiles(res.files || []);
      }
    } catch (err) {
      setError(err.message || "Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategoryFiles();
  }, [category, searchQuery, refreshTrigger]);

  const handleToggleFavorite = async (file) => {
    try {
      await fileApi.update(file._id, { isFavorite: !file.isFavorite });
      triggerRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await fileApi.trash(deleteTarget._id);
      setDeleteTarget(null);
      triggerRefresh();
    } catch (err) {
      alert(err.message || "Failed to move to Trash");
    }
  };

  const getCategoryTitle = (cat) => {
    switch (cat) {
      case "image": return "Photos & Images";
      case "video": return "Videos";
      case "audio": return "Audio & Music";
      case "document": return "Documents & PDFs";
      case "code": return "Code & Development";
      case "archive": return "Compressed Archives";
      default: return `${cat?.toUpperCase()} Files`;
    }
  };

  return (
    <div className="category-page-container animate-fade-in">
      <div className="category-header-banner glass-panel">
        <div className="category-title-combo">
          <div className="category-header-icon-box">
            {getCategoryIcon(category, 32)}
          </div>
          <div>
            <h2>{getCategoryTitle(category)}</h2>
            <p className="category-file-count">{files.length} file(s) found</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="page-loading-skeleton">
          <div className="skeleton-spinner" />
          <p>Filtering files...</p>
        </div>
      ) : error ? (
        <div className="alert-error-box page-error">{error}</div>
      ) : files.length === 0 ? (
        <div className="empty-drive-state glass-panel">
          <div className="empty-state-icon-glow">
            {getCategoryIcon(category, 48)}
          </div>
          <h3>No {getCategoryTitle(category)}</h3>
          <p>You haven't uploaded any {category} files yet.</p>
          <button className="btn btn-primary" onClick={openUpload}>
            Upload Now
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="files-grid-layout">
          {files.map((file) => (
            <FileCard
              key={file._id}
              file={file}
              onPreview={openPreview}
              onShare={(f) => openShare(f, "file")}
              onMove={(f) => openMove(f, "file")}
              onRename={(f) => {}}
              onDelete={(f) => setDeleteTarget(f)}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      ) : (
        <div className="files-list-layout">
          <div className="list-table-header">
            <span className="col-header-name">Name</span>
            <span className="col-header-category">Type</span>
            <span className="col-header-size">Size</span>
            <span className="col-header-date">Last Modified</span>
            <span className="col-header-actions">Actions</span>
          </div>
          {files.map((file) => (
            <FileListRow
              key={file._id}
              file={file}
              onPreview={openPreview}
              onShare={(f) => openShare(f, "file")}
              onMove={(f) => openMove(f, "file")}
              onRename={(f) => {}}
              onDelete={(f) => setDeleteTarget(f)}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Move to Trash?"
        message={`Move "${deleteTarget?.name}" to Trash?`}
        confirmText="Move to Trash"
      />
    </div>
  );
};

export default CategoryPage;
