import React, { useState, useRef, useEffect } from "react";
import { MoreVertical, Eye, Download, Share2, Star, Trash2, FolderSymlink, Edit3 } from "lucide-react";
import { getCategoryIcon, formatFileSize } from "./FileCard";
import { fileApi } from "../../services/api";

export const FileListRow = ({
  file,
  onPreview,
  onShare,
  onMove,
  onRename,
  onDelete,
  onToggleFavorite,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDownload = async (e) => {
    e.stopPropagation();
    try {
      const res = await fileApi.getDownloadUrl(file._id);
      if (res.downloadUrl) {
        const link = document.createElement("a");
        link.href = res.downloadUrl;
        link.download = file.originalName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error("Failed to initiate download:", err);
    }
  };

  return (
    <div className="file-list-row glass-panel" onClick={() => onPreview(file)}>
      <div className="list-col-name">
        <div className="list-file-icon">{getCategoryIcon(file.category, 20)}</div>
        <span className="list-file-title" title={file.name}>
          {file.name}
        </span>
      </div>

      <div className="list-col-category">
        <span className="badge badge-primary">{file.category}</span>
      </div>

      <div className="list-col-size">{formatFileSize(file.size)}</div>

      <div className="list-col-date">{new Date(file.createdAt).toLocaleDateString()}</div>

      <div className="list-col-actions" onClick={(e) => e.stopPropagation()}>
        <button
          className={`btn-icon ${file.isFavorite ? "active" : ""}`}
          onClick={() => onToggleFavorite(file)}
          title={file.isFavorite ? "Unstar" : "Star"}
        >
          <Star
            size={16}
            fill={file.isFavorite ? "#F59E0B" : "none"}
            color={file.isFavorite ? "#F59E0B" : "var(--text-muted)"}
          />
        </button>

        <div className="relative-menu-container" ref={menuRef}>
          <button className="btn-icon" onClick={() => setMenuOpen(!menuOpen)}>
            <MoreVertical size={16} />
          </button>

          {menuOpen && (
            <div className="dropdown-menu-floating glass-panel">
              <button
                className="dropdown-item"
                onClick={() => {
                  setMenuOpen(false);
                  onPreview(file);
                }}
              >
                <Eye size={15} />
                <span>Preview</span>
              </button>

              <button className="dropdown-item" onClick={handleDownload}>
                <Download size={15} />
                <span>Download</span>
              </button>

              <button
                className="dropdown-item"
                onClick={() => {
                  setMenuOpen(false);
                  onShare(file);
                }}
              >
                <Share2 size={15} />
                <span>Share</span>
              </button>

              <button
                className="dropdown-item"
                onClick={() => {
                  setMenuOpen(false);
                  onRename(file);
                }}
              >
                <Edit3 size={15} />
                <span>Rename</span>
              </button>

              <button
                className="dropdown-item"
                onClick={() => {
                  setMenuOpen(false);
                  onMove(file);
                }}
              >
                <FolderSymlink size={15} />
                <span>Move</span>
              </button>

              <div className="dropdown-divider" />

              <button
                className="dropdown-item danger"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(file);
                }}
              >
                <Trash2 size={15} />
                <span>Move to Trash</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileListRow;
