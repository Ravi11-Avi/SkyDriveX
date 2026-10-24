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
  image: { text: "text-sky-400", bg: "bg-sky-400/10", border: "border-sky-400/20" },
  video: { text: "text-rose-400", bg: "bg-rose-400/10", border: "border-rose-400/20" },
  audio: { text: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20" },
  document: { text: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" },
  code: { text: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
  archive: { text: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
  other: { text: "text-zinc-400", bg: "bg-zinc-400/10", border: "border-zinc-400/20" },
};

export const FileCard = ({
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
  const style = CATEGORY_STYLES[category] || CATEGORY_STYLES.other;
  const isImage = category === "image";

  return (
    <div
      onClick={() => onPreview && onPreview(file)}
      className="group relative flex flex-col rounded-2xl bg-[#0c0f17]/90 hover:bg-[#111624] border border-white/[0.07] hover:border-indigo-500/35 transition-all duration-200 cursor-pointer overflow-hidden shadow-lg shadow-black/20 hover:shadow-indigo-500/5 hover:-translate-y-0.5"
    >
      {/* Thumbnail Stage */}
      <div className="relative h-32 w-full bg-[#080a11] flex items-center justify-center overflow-hidden border-b border-white/[0.04]">
        {isImage && file.s3Url ? (
          <img
            src={file.s3Url}
            alt={file.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${style.bg} ${style.text} ${style.border} border`}>
            <IconComponent size={26} className="stroke-[1.8]" />
          </div>
        )}

        {/* Hover Quick Action Buttons */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2"
        >
          <button
            onClick={() => onPreview && onPreview(file)}
            className="p-2 rounded-xl bg-black/60 text-white hover:bg-indigo-600 transition-colors shadow-lg cursor-pointer"
            title="Preview"
          >
            <Eye size={15} />
          </button>
          <button
            onClick={handleDownloadClick}
            disabled={downloading}
            className="p-2 rounded-xl bg-black/60 text-white hover:bg-indigo-600 transition-colors shadow-lg cursor-pointer"
            title="Download"
          >
            <Download size={15} />
          </button>
          {onShare && (
            <button
              onClick={() => onShare(file)}
              className="p-2 rounded-xl bg-black/60 text-white hover:bg-indigo-600 transition-colors shadow-lg cursor-pointer"
              title="Share"
            >
              <Share2 size={15} />
            </button>
          )}
        </div>

        {/* Star Button Badge */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite && onToggleFavorite(file);
          }}
          className={`absolute top-2 left-2 p-1.5 rounded-lg transition-colors cursor-pointer ${
            file.isFavorite
              ? "text-amber-400 bg-black/60 backdrop-blur-sm"
              : "text-zinc-500 opacity-0 group-hover:opacity-100 hover:text-amber-400 bg-black/40 backdrop-blur-sm"
          }`}
          title={file.isFavorite ? "Unstar file" : "Star file"}
        >
          <Star size={13} fill={file.isFavorite ? "currentColor" : "none"} />
        </button>

        {/* Extension Pill */}
        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-black/60 text-zinc-400 border border-white/10 backdrop-blur-sm">
          {file.extension?.replace(".", "") || file.name.split(".").pop()}
        </div>
      </div>

      {/* File Details */}
      <div className="p-3.5 flex items-center justify-between gap-2">
        <div className="flex flex-col min-w-0 flex-1">
          <h4 className="text-xs font-semibold text-zinc-100 group-hover:text-white truncate" title={file.name}>
            {file.name}
          </h4>
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 mt-0.5 font-medium">
            <span>{formatFileSize(file.size)}</span>
            <span>•</span>
            <span>{new Date(file.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Dropdown Menu */}
        <div className="relative shrink-0" ref={menuRef} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.08] transition-colors cursor-pointer"
            title="File options"
          >
            <MoreVertical size={15} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 bottom-full mb-1.5 w-44 bg-[#0c101a] border border-white/10 rounded-xl shadow-2xl p-1 z-30 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
              <button
                onClick={(e) => {
                  setMenuOpen(false);
                  handleDownloadClick(e);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors cursor-pointer"
              >
                <Download size={14} className="text-indigo-400" />
                <span>Download</span>
              </button>

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

export default FileCard;
