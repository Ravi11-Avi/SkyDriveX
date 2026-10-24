import React, { useState, useRef, useEffect } from "react";
import {
  Folder,
  MoreVertical,
  Download,
  Share2,
  Star,
  Trash2,
  FolderSymlink,
  Edit3,
} from "lucide-react";

export const FolderCard = ({
  folder,
  onClick,
  onOpen,
  onShare,
  onMove,
  onRename,
  onDelete,
  onTrash,
  onDownloadZip,
  onToggleFavorite,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Normalize handlers
  const handleOpen = () => {
    if (onClick) onClick(folder);
    else if (onOpen) onOpen(folder);
  };

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

  const folderColor = folder.color || "#6366f1";

  return (
    <div
      onClick={handleOpen}
      className="group relative flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-[#0c0f17]/90 hover:bg-slate-50 dark:hover:bg-[#111624] border border-slate-200/80 dark:border-white/[0.07] hover:border-indigo-500/40 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-0.5 select-none"
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 duration-200"
          style={{ backgroundColor: `${folderColor}18`, color: folderColor }}
        >
          <Folder size={24} className="stroke-[2.2] fill-current opacity-90" />
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 dark:text-zinc-100 dark:group-hover:text-white truncate">
            {folder.name}
          </h4>
          <span className="text-[11px] text-slate-500 dark:text-zinc-500 font-medium">Folder</span>
        </div>
      </div>

      {/* Action Controls */}
      <div
        className="flex items-center gap-1 shrink-0 ml-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => onToggleFavorite && onToggleFavorite(folder)}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            folder.isFavorite
              ? "text-amber-400 bg-amber-400/10"
              : "text-slate-300 dark:text-zinc-600 hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-white/[0.04]"
          }`}
          title={folder.isFavorite ? "Unstar folder" : "Star folder"}
        >
          <Star
            size={15}
            fill={folder.isFavorite ? "currentColor" : "none"}
            className="stroke-[2]"
          />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
            title="Folder actions"
          >
            <MoreVertical size={16} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-48 bg-white dark:bg-[#0c101a] border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl p-1 z-30 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
              {onDownloadZip && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDownloadZip(folder);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-lg transition-colors cursor-pointer"
                >
                  <Download size={14} className="text-indigo-500" />
                  <span>Download as ZIP</span>
                </button>
              )}

              {onShare && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onShare(folder, "folder");
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-lg transition-colors cursor-pointer"
                >
                  <Share2 size={14} className="text-cyan-500" />
                  <span>Share link</span>
                </button>
              )}

              {onRename && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onRename(folder);
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
                    onMove(folder, "folder");
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
                  handleDelete(folder);
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

export default FolderCard;
