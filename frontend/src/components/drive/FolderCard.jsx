import React, { useState, useRef, useEffect } from "react";
import { Folder, MoreVertical, Download, Share2, Star, Trash2, FolderSymlink, Edit3 } from "lucide-react";

export const FolderCard = ({
  folder,
  onClick,
  onShare,
  onMove,
  onRename,
  onDelete,
  onDownloadZip,
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

  return (
    <div
      className="folder-card-shell card glass-panel"
      onClick={() => onClick(folder)}
    >
      <div className="folder-card-header">
        <div
          className="folder-icon-wrapper"
          style={{ backgroundColor: `${folder.color || "#4F46E5"}22` }}
        >
          <Folder size={28} style={{ color: folder.color || "#4F46E5" }} />
        </div>

        <div className="folder-card-controls" onClick={(e) => e.stopPropagation()}>
          <button
            className={`btn-icon folder-star-btn ${folder.isFavorite ? "active" : ""}`}
            onClick={() => onToggleFavorite(folder)}
            title={folder.isFavorite ? "Unstar folder" : "Star folder"}
          >
            <Star size={16} fill={folder.isFavorite ? "#F59E0B" : "none"} color={folder.isFavorite ? "#F59E0B" : "currentColor"} />
          </button>

          <div className="relative-menu-container" ref={menuRef}>
            <button
              className="btn-icon"
              onClick={() => setMenuOpen(!menuOpen)}
              title="Folder actions"
            >
              <MoreVertical size={16} />
            </button>

            {menuOpen && (
              <div className="dropdown-menu-floating glass-panel">
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setMenuOpen(false);
                    onDownloadZip(folder);
                  }}
                >
                  <Download size={15} />
                  <span>Download as ZIP</span>
                </button>

                <button
                  className="dropdown-item"
                  onClick={() => {
                    setMenuOpen(false);
                    onShare(folder);
                  }}
                >
                  <Share2 size={15} />
                  <span>Share Folder</span>
                </button>

                <button
                  className="dropdown-item"
                  onClick={() => {
                    setMenuOpen(false);
                    onRename(folder);
                  }}
                >
                  <Edit3 size={15} />
                  <span>Rename</span>
                </button>

                <button
                  className="dropdown-item"
                  onClick={() => {
                    setMenuOpen(false);
                    onMove(folder);
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
                    onDelete(folder);
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

      <div className="folder-card-body">
        <h4 className="folder-card-title" title={folder.name}>
          {folder.name}
        </h4>
        <span className="folder-card-meta">Folder</span>
      </div>
    </div>
  );
};

export default FolderCard;
