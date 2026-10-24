import React, { useState, useEffect } from "react";
import { Folder, FolderSymlink, X, Check, HardDrive } from "lucide-react";
import { folderApi, fileApi } from "../../services/api";

export const MoveItemModal = ({ isOpen, onClose, item, itemType = "file", onMoved }) => {
  const [folders, setFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const fetchAllFolders = async () => {
      setLoading(true);
      setError("");
      try {
        // Fetch root and subfolders
        const res = await folderApi.getContents(null);
        if (res.success && res.folders) {
          // If item is a folder, filter out itself from destination candidates
          const filtered = itemType === "folder" && item
            ? res.folders.filter((f) => f._id !== item._id)
            : res.folders;
          setFolders(filtered);
        }
      } catch (err) {
        setError("Could not load folders list");
      } finally {
        setLoading(false);
      }
    };
    fetchAllFolders();
  }, [isOpen, item, itemType]);

  if (!isOpen || !item) return null;

  const handleMove = async () => {
    setSubmitting(true);
    setError("");

    try {
      if (itemType === "folder") {
        await folderApi.move(item._id, selectedFolderId);
      } else {
        await fileApi.move(item._id, selectedFolderId);
      }

      onMoved();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to move item");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-with-icon">
            <div className="modal-header-icon primary-accent">
              <FolderSymlink size={20} />
            </div>
            <h3>Move "{item.name}"</h3>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {error && <div className="alert-error-box">{error}</div>}

          <p className="modal-instruction-text">Select destination location:</p>

          <div className="folder-tree-picker">
            {/* Root Option */}
            <div
              className={`folder-picker-item ${selectedFolderId === null ? "selected" : ""}`}
              onClick={() => setSelectedFolderId(null)}
            >
              <div className="folder-picker-left">
                <HardDrive size={18} className="folder-picker-icon" />
                <span className="folder-picker-name">My Drive (Root Directory)</span>
              </div>
              {selectedFolderId === null && <Check size={16} className="folder-picker-check" />}
            </div>

            {/* Folder list */}
            {loading ? (
              <div className="picker-loading">Loading folders...</div>
            ) : (
              folders.map((f) => (
                <div
                  key={f._id}
                  className={`folder-picker-item ${selectedFolderId === f._id ? "selected" : ""}`}
                  onClick={() => setSelectedFolderId(f._id)}
                >
                  <div className="folder-picker-left">
                    <Folder size={18} style={{ color: f.color || "#6366f1" }} className="folder-picker-icon" />
                    <span className="folder-picker-name">{f.name}</span>
                  </div>
                  {selectedFolderId === f._id && <Check size={16} className="folder-picker-check" />}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleMove} disabled={submitting}>
            {submitting ? "Moving..." : "Move Here"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoveItemModal;
