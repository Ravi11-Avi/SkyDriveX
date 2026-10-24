import React, { useState, useRef, useEffect } from "react";
import {
  FileText,
  Image,
  Video,
  Music,
  Code,
  Archive,
  MoreVertical,
  Download,
  Share2,
  Star,
  Trash2,
  FolderSymlink,
  Edit3,
  Eye,
} from "lucide-react";
import { fileApi } from "../../services/api";

const CATEGORY_ICONS = {
  image: Image,
  video: Video,
  audio: Music,
  document: FileText,
  code: Code,
  archive: Archive,
};

const CATEGORY_STYLES = {
  image: "text-sky-400 bg-sky-400/10 border-sky-400/20",
  video: "text-rose-400 bg-rose-400/10 border-rose-400/20",
  audio: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  document: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  code: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  archive: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  other: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20",
};

export const FileListRow = ({
  file,
  onPreview,
  onDownload,
  onShare,
  onMove,
  onRename,
  onDelete,
  onTrash,
  onToggleFavorite,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const menuRef = useRef(null);

  const handleDelete = (f) => {
    if (onTrash) onTrash(f);
    else if (onDelete) onDelete(f);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDownloadClick = async (e) => {
    e.stopPropagation();
    try {
      setDownloading(true);
      const res = await fileApi.getDownloadUrl(file._id);
      if (res.success && res.downloadUrl) {
        const a = document.createElement("a");
        a.href = res.downloadUrl;
        a.download = res.fileName || file.originalName || file.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (err) {
      alert(err.message || "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return "--";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const category = file.category || "other";
  const IconComponent = CATEGORY_ICONS[category] || FileText;
  const badgeClass = CATEGORY_STYLES[category] || CATEGORY_STYLES.other;

  return (
    <div
      onClick={() => onPreview && onPreview(file)}
      className="group flex items-center justify-between px-4 py-3 rounded-xl bg-[#0c0f17]/50 hover:bg-[#111624] border border-white/[0.04] hover:border-indigo-500/30 transition-all duration-150 cursor-pointer"
    >
      {/* File Name & Icon */}
      <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite && onToggleFavorite(file);
          }}
          className={`p-1 rounded-md transition-colors cursor-pointer ${
            file.isFavorite
              ? "text-amber-400"
              : "text-zinc-600 opacity-0 group-hover:opacity-100 hover:text-amber-400"
          }`}
          title={file.isFavorite ? "Unstar" : "Star"}
        >
          <Star size={14} fill={file.isFavorite ? "currentColor" : "none"} />
        </button>

        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${badgeClass}`}>
          <IconComponent size={16} />
        </div>

        <span className="text-sm font-medium text-zinc-200 group-hover:text-white truncate">
          {file.name}
        </span>
      </div>

      {/* Category Tag */}
      <div className="hidden sm:block w-28 shrink-0">
        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-wider border ${badgeClass}`}>
          {category}
        </span>
      </div>

      {/* File Size */}
      <div className="hidden md:block w-24 text-xs font-mono text-zinc-400 shrink-0">
        {formatFileSize(file.size)}
      </div>

      {/* Date */}
      <div className="hidden lg:block w-32 text-xs text-zinc-500 shrink-0">
        {new Date(file.createdAt).toLocaleDateString()}
      </div>

      {/* Action Buttons */}
      <div
        className="flex items-center gap-1 shrink-0 ml-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => onPreview && onPreview(file)}
          className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.08] transition-colors cursor-pointer"
          title="Preview"
        >
          <Eye size={15} />
        </button>
        <button
          onClick={handleDownloadClick}
          disabled={downloading}
          className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.08] transition-colors cursor-pointer"
          title="Download"
        >
          <Download size={15} />
        </button>

        {/* 3-dot dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.08] transition-colors cursor-pointer"
            title="Options"
          >
            <MoreVertical size={15} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-44 bg-[#0c101a] border border-white/10 rounded-xl shadow-2xl p-1 z-30 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
              {onShare && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onShare(file);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors cursor-pointer"
                >
                  <Share2 size={14} className="text-cyan-400" />
                  <span>Share link</span>
                </button>
              )}

              {onRename && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onRename(file);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors cursor-pointer"
                >
                  <Edit3 size={14} className="text-zinc-400" />
                  <span>Rename</span>
                </button>
              )}

              {onMove && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onMove(file);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors cursor-pointer"
                >
                  <FolderSymlink size={14} className="text-amber-400" />
                  <span>Move to...</span>
                </button>
              )}

              <div className="h-px bg-white/[0.06] my-1" />

              <button
                onClick={() => {
                  setMenuOpen(false);
                  handleDelete(file);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 size={14} />
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
