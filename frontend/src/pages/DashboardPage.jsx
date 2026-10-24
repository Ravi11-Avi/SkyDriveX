import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import {
  Folder,
  File,
  ChevronRight,
  HardDrive,
  UploadCloud,
  FolderPlus,
  ArrowUpDown,
  Download,
  Search,
} from "lucide-react";
import { folderApi, fileApi } from "../services/api";
import { FolderCard } from "../components/drive/FolderCard";
import { FileCard } from "../components/drive/FileCard";
import { FileListRow } from "../components/drive/FileListRow";
import { ConfirmModal } from "../components/modals/ConfirmModal";

export const DashboardPage = () => {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const {
    viewMode,
    searchQuery,
    setCurrentFolderId,
    openPreview,
    openShare,
    openMove,
    openUpload,
    openCreateFolder,
    refreshTrigger,
    triggerRefresh,
  } = useOutletContext();

  const [currentFolder, setCurrentFolder] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Rename state
  const [renameItem, setRenameItem] = useState(null);
  const [renameName, setRenameName] = useState("");

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null); // { item, type }

  // Sync currentFolderId to layout
  useEffect(() => {
    setCurrentFolderId(folderId || null);
  }, [folderId, setCurrentFolderId]);

  const loadContents = async () => {
    setLoading(true);
    setError("");

    try {
      if (searchQuery) {
        // Global search query
        const res = await fileApi.getFiles({ search: searchQuery });
        if (res.success) {
          setFiles(res.files || []);
          setFolders([]);
          setCurrentFolder(null);
          setBreadcrumbs([]);
        }
      } else {
        const res = await folderApi.getContents(folderId || null);
        if (res.success) {
          setCurrentFolder(res.currentFolder || null);
          setBreadcrumbs(res.breadcrumbs || []);
          setFolders(res.folders || []);
          setFiles(res.files || []);
        }
      }
    } catch (err) {
      setError(err.message || "Failed to load directory contents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContents();
  }, [folderId, searchQuery, refreshTrigger]);

  const handleDownloadZip = (folder) => {
    const url = folderApi.getZipDownloadUrl(folder._id);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${folder.name}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleToggleFavoriteFolder = async (folder) => {
    try {
      await folderApi.update(folder._id, { isFavorite: !folder.isFavorite });
      triggerRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFavoriteFile = async (file) => {
    try {
      await fileApi.update(file._id, { isFavorite: !file.isFavorite });
      triggerRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRenameSubmit = async (e) => {
    e.preventDefault();
    if (!renameName.trim() || !renameItem) return;

    try {
      if (renameItem.type === "folder") {
        await folderApi.update(renameItem.item._id, { name: renameName.trim() });
      } else {
        await fileApi.update(renameItem.item._id, { name: renameName.trim() });
      }
      setRenameItem(null);
      triggerRefresh();
    } catch (err) {
      alert(err.message || "Failed to rename");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      if (deleteTarget.type === "folder") {
        await folderApi.trash(deleteTarget.item._id);
      } else {
        await fileApi.trash(deleteTarget.item._id);
      }
      setDeleteTarget(null);
      triggerRefresh();
    } catch (err) {
      alert(err.message || "Failed to move to Trash");
    }
  };

  return (
    <div className="dashboard-page-container animate-fade-in">
      {/* Breadcrumb Header Bar */}
      <div className="dashboard-header-bar">
        <div className="breadcrumbs-trail">
          <button
            className={`breadcrumb-node ${!folderId && !searchQuery ? "active" : ""}`}
            onClick={() => navigate("/")}
          >
            <HardDrive size={16} />
            <span>My Drive</span>
          </button>

          {searchQuery ? (
            <>
              <ChevronRight size={14} className="breadcrumb-separator" />
              <span className="breadcrumb-node active">
                <Search size={14} />
                <span>Search: "{searchQuery}"</span>
              </span>
            </>
          ) : (
            breadcrumbs.map((b, idx) => (
              <React.Fragment key={b._id}>
                <ChevronRight size={14} className="breadcrumb-separator" />
                <button
                  className={`breadcrumb-node ${idx === breadcrumbs.length - 1 ? "active" : ""}`}
                  onClick={() => navigate(`/folder/${b._id}`)}
                >
                  <Folder size={15} />
                  <span>{b.name}</span>
                </button>
              </React.Fragment>
            ))
          )}
        </div>

        {/* Action Shortcuts */}
        <div className="header-action-shortcuts">
          <button className="btn btn-secondary btn-sm" onClick={openCreateFolder}>
            <FolderPlus size={16} />
            <span>New Folder</span>
          </button>
          <button className="btn btn-primary btn-sm" onClick={openUpload}>
            <UploadCloud size={16} />
            <span>Upload</span>
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="page-loading-skeleton">
          <div className="skeleton-spinner" />
          <p>Loading files and folders...</p>
        </div>
      ) : error ? (
        <div className="alert-error-box page-error">
          <p>{error}</p>
        </div>
      ) : (
        <div className="dashboard-sections-stack">
          {/* Folders Section */}
          {folders.length > 0 && (
            <section className="drive-section">
              <div className="section-title-row">
                <h3 className="section-title">Folders ({folders.length})</h3>
              </div>
              <div className="folders-grid-layout">
                {folders.map((f) => (
                  <FolderCard
                    key={f._id}
                    folder={f}
                    onClick={() => navigate(`/folder/${f._id}`)}
                    onShare={(f) => openShare(f, "folder")}
                    onMove={(f) => openMove(f, "folder")}
                    onRename={(f) => {
                      setRenameItem({ item: f, type: "folder" });
                      setRenameName(f.name);
                    }}
                    onDelete={(f) => setDeleteTarget({ item: f, type: "folder" })}
                    onDownloadZip={handleDownloadZip}
                    onToggleFavorite={handleToggleFavoriteFolder}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Files Section */}
          {files.length > 0 && (
            <section className="drive-section">
              <div className="section-title-row">
                <h3 className="section-title">Files ({files.length})</h3>
              </div>

              {viewMode === "grid" ? (
                <div className="files-grid-layout">
                  {files.map((file) => (
                    <FileCard
                      key={file._id}
                      file={file}
                      onPreview={openPreview}
                      onShare={(f) => openShare(f, "file")}
                      onMove={(f) => openMove(f, "file")}
                      onRename={(f) => {
                        setRenameItem({ item: f, type: "file" });
                        setRenameName(f.name);
                      }}
                      onDelete={(f) => setDeleteTarget({ item: f, type: "file" })}
                      onToggleFavorite={handleToggleFavoriteFile}
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
                      onRename={(f) => {
                        setRenameItem({ item: f, type: "file" });
                        setRenameName(f.name);
                      }}
                      onDelete={(f) => setDeleteTarget({ item: f, type: "file" })}
                      onToggleFavorite={handleToggleFavoriteFile}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Empty State */}
          {folders.length === 0 && files.length === 0 && (
            <div className="empty-drive-state glass-panel">
              <div className="empty-state-icon-glow">
                <UploadCloud size={48} />
              </div>
              <h3>This directory is empty</h3>
              <p>Drag and drop files here, or use the buttons below to get started</p>
              <div className="empty-state-buttons">
                <button className="btn btn-secondary" onClick={openCreateFolder}>
                  <FolderPlus size={18} />
                  <span>Create Folder</span>
                </button>
                <button className="btn btn-primary" onClick={openUpload}>
                  <UploadCloud size={18} />
                  <span>Upload Files</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rename Modal */}
      {renameItem && (
        <div className="modal-backdrop" onClick={() => setRenameItem(null)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Rename {renameItem.type === "folder" ? "Folder" : "File"}</h3>
            </div>
            <form onSubmit={handleRenameSubmit}>
              <div className="modal-body">
                <div className="input-group">
                  <label className="input-label">New Name</label>
                  <input
                    type="text"
                    className="input-field"
                    value={renameName}
                    onChange={(e) => setRenameName(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setRenameItem(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title={`Move to Trash?`}
        message={`Are you sure you want to move "${deleteTarget?.item?.name}" to Trash? Items in Trash are automatically cleared after 30 days.`}
        confirmText="Move to Trash"
      />
    </div>
  );
};

export default DashboardPage;
