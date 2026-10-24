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
  image: "text-sky-500 dark:text-sky-400 bg-sky-500/10 border-sky-500/20",
  video: "text-rose-500 dark:text-rose-400 bg-rose-500/10 border-rose-500/20",
  audio: "text-purple-500 dark:text-purple-400 bg-purple-500/10 border-purple-500/20",
  document: "text-blue-500 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
  code: "text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  archive: "text-amber-500 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
  other: "text-slate-500 dark:text-zinc-400 bg-slate-500/10 border-slate-500/20",
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
      className="group flex items-center justify-between px-4 py-3 rounded-xl bg-white dark:bg-[#0c0f17]/50 hover:bg-slate-50 dark:hover:bg-[#111624] border border-slate-200/80 dark:border-white/[0.04] hover:border-indigo-500/40 transition-all duration-150 cursor-pointer shadow-xs select-none"
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
              : "text-slate-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 hover:text-amber-400"
          }`}
          title={file.isFavorite ? "Unstar" : "Star"}
        >
          <Star size={14} fill={file.isFavorite ? "currentColor" : "none"} />
        </button>

        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${badgeClass}`}>
          <IconComponent size={16} />
        </div>

        <span className="text-sm font-medium text-slate-800 group-hover:text-indigo-600 dark:text-zinc-200 dark:group-hover:text-white truncate">
          {file.name}
        </span>
      </div>

      {/* Category Tag */}
      <div className="hidden sm:block w-28 shrink-0">
        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${badgeClass}`}>
          {category}
        </span>
      </div>

      {/* File Size */}
      <div className="hidden md:block w-24 text-xs font-mono text-slate-500 dark:text-zinc-400 shrink-0">
        {formatFileSize(file.size)}
      </div>

      {/* Modified Date */}
      <div className="hidden lg:block w-32 text-xs text-slate-400 dark:text-zinc-500 shrink-0">
        {new Date(file.createdAt).toLocaleDateString()}
      </div>

      {/* Action Controls */}
      <div
        className="flex items-center gap-1 shrink-0 ml-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => onPreview && onPreview(file)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
          title="Preview"
        >
          <Eye size={15} />
        </button>

        <button
          onClick={handleDownloadClick}
          disabled={downloading}
          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
          title="Download"
        >
          <Download size={15} />
        </button>

        {onShare && (
          <button
            onClick={() => onShare(file, "file")}
            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-600 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
            title="Share link"
          >
            <Share2 size={15} />
          </button>
        )}

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
            title="More actions"
          >
            <MoreVertical size={15} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-[#0c101a] border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl p-1 z-30 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
              {onRename && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onRename(file);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-lg transition-colors cursor-pointer"
                >
                  <Edit3 size={14} className="text-slate-400 dark:text-zinc-400" />
                  <span>Rename</span>
                </button>
              )}

              {onMove && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onMove(file, "file");
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-lg transition-colors cursor-pointer"
                >
                  <FolderSymlink size={14} className="text-amber-500" />
                  <span>Move to...</span>
                </button>
              )}

              <div className="h-px bg-slate-200 dark:bg-white/[0.06] my-1" />

              <button
                onClick={() => {
                  setMenuOpen(false);
                  handleDelete(file);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
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
