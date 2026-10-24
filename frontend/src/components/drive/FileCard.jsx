import React, { useState, useRef, useEffect } from "react";
import {
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Code,
  Archive,
  File,
  MoreVertical,
  Eye,
  Download,
  Share2,
  Star,
  Trash2,
  FolderSymlink,
  Edit3,
} from "lucide-react";
import { fileApi } from "../../services/api";

export const getCategoryIcon = (category, size = 26) => {
  switch (category) {
    case "image":
      return <ImageIcon size={size} color="#EC4899" />;
    case "video":
      return <Video size={size} color="#8B5CF6" />;
    case "audio":
      return <Music size={size} color="#F59E0B" />;
    case "document":
    case "pdf":
      return <FileText size={size} color="#3B82F6" />;
    case "code":
      return <Code size={size} color="#10B981" />;
    case "archive":
      return <Archive size={size} color="#F97316" />;
    default:
      return <File size={size} color="#94A3B8" />;
  }
};

export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

export const FileCard = ({
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
    <div
      className="file-card-shell card glass-panel"
      onClick={() => onPreview(file)}
    >
      {/* File Card Thumbnail / Preview box */}
      <div className="file-thumbnail-container">
        {file.category === "image" && file.s3Url ? (
          <img
            src={file.s3Url}
            alt={file.name}
            className="file-thumbnail-img"
            loading="lazy"
            onError={(e) => {
              // Fallback to icon if direct load fails
              e.currentTarget.style.display = "none";
              e.currentTarget.nextSibling.style.display = "flex";
            }}
          />
        ) : null}

        <div
          className="file-thumbnail-fallback"
          style={{ display: file.category === "image" && file.s3Url ? "none" : "flex" }}
        >
          {getCategoryIcon(file.category, 36)}
        </div>

        {/* Top Floating Actions */}
        <div className="file-thumbnail-overlay" onClick={(e) => e.stopPropagation()}>
          <button
            className={`btn-icon file-star-btn ${file.isFavorite ? "active" : ""}`}
            onClick={() => onToggleFavorite(file)}
            title={file.isFavorite ? "Unstar file" : "Star file"}
          >
            <Star
              size={15}
              fill={file.isFavorite ? "#F59E0B" : "none"}
              color={file.isFavorite ? "#F59E0B" : "#ffffff"}
            />
          </button>

          <div className="relative-menu-container" ref={menuRef}>
            <button
              className="btn-icon"
              onClick={() => setMenuOpen(!menuOpen)}
              title="File actions"
            >
              <MoreVertical size={15} />
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
                  <span>Share Link</span>
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
                  <span>Move to...</span>
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

      {/* File Info */}
      <div className="file-card-details">
        <h4 className="file-card-name" title={file.name}>
          {file.name}
        </h4>
        <div className="file-card-submeta">
          <span>{formatFileSize(file.size)}</span>
          <span className="meta-bullet">•</span>
          <span>{new Date(file.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};

export default FileCard;
