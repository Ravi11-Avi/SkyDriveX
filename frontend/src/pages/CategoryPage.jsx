import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import {
  Image,
  Video,
  Music,
  FileText,
  Code,
  Archive,
  Layers,
  Inbox,
  UploadCloud,
} from "lucide-react";
import { fileApi } from "../services/api";
import { FileCard } from "../components/drive/FileCard";
import { FileListRow } from "../components/drive/FileListRow";
import { ConfirmModal } from "../components/modals/ConfirmModal";

const CATEGORY_META = {
  image: { label: "Photos & Images", icon: Image, color: "text-sky-400", bg: "bg-sky-400/10" },
  video: { label: "Videos", icon: Video, color: "text-rose-400", bg: "bg-rose-400/10" },
  audio: { label: "Audio & Music", icon: Music, color: "text-purple-400", bg: "bg-purple-400/10" },
  document: { label: "Documents", icon: FileText, color: "text-blue-400", bg: "bg-blue-400/10" },
  code: { label: "Code & Text", icon: Code, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  archive: { label: "Compressed Archives", icon: Archive, color: "text-amber-400", bg: "bg-amber-400/10" },
};

export const CategoryPage = () => {
  const { category } = useParams();
  const navigate = useNavigate();
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
  const [error, setError] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const meta = CATEGORY_META[category] || {
    label: "Files",
    icon: Layers,
    color: "text-indigo-400",
    bg: "bg-indigo-400/10",
  };
  const IconComponent = meta.icon;

  useEffect(() => {
    const fetchCategoryFiles = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fileApi.getFiles({ category });
        if (res.success) {
          setFiles(res.files || []);
        }
      } catch (err) {
        setError(err.message || "Failed to load category files");
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryFiles();
  }, [category, refreshTrigger]);

  const handleToggleFavorite = async (file) => {
    try {
      await fileApi.update(file._id, { isFavorite: !file.isFavorite });
      setFiles((prev) =>
        prev.map((f) => (f._id === file._id ? { ...f, isFavorite: !f.isFavorite } : f))
      );
    } catch (err) {
      alert(err.message || "Failed to update favorite");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await fileApi.trash(deleteTarget._id);
      setFiles((prev) => prev.filter((f) => f._id !== deleteTarget._id));
      setDeleteTarget(null);
      triggerRefresh();
    } catch (err) {
      alert(err.message || "Failed to move file to trash");
    }
  };

  const query = (searchQuery || "").trim().toLowerCase();
  const filteredFiles = files.filter(
    (f) =>
      f.name.toLowerCase().includes(query) ||
      (f.extension && f.extension.toLowerCase().includes(query))
  );

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Category Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3.5">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${meta.bg} ${meta.color} border border-white/5`}>
            <IconComponent size={22} className="stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-['Outfit'] text-white">
              {meta.label}
            </h1>
            <p className="text-xs text-zinc-400">
              {files.length} {files.length === 1 ? "file" : "files"} in this category
            </p>
          </div>
        </div>

        <button
          onClick={openUpload}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white text-xs font-medium shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
        >
          <UploadCloud size={14} />
          <span>Upload</span>
        </button>
      </div>

      {/* Files Display */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-500">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-xs font-medium">Filtering files...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
          {error}
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
            <Inbox size={32} className="stroke-[1.6]" />
          </div>
          <h3 className="text-lg font-bold font-['Outfit'] text-white mb-1">
            No {meta.label.toLowerCase()} found
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mb-6">
            Upload files of this type and they will be automatically organized here.
          </p>
          <button
            onClick={openUpload}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
          >
            <UploadCloud size={15} />
            <span>Upload {meta.label}</span>
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
          {filteredFiles.map((file) => (
            <FileCard
              key={file._id}
              file={file}
              onPreview={openPreview}
              onShare={(f) => openShare(f, "file")}
              onMove={(f) => openMove(f, "file")}
              onRename={() => {}}
              onDelete={(f) => setDeleteTarget(f)}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            <span className="flex-1 mr-4">Name</span>
            <span className="hidden sm:block w-28">Category</span>
            <span className="hidden md:block w-24">Size</span>
            <span className="hidden lg:block w-32">Modified</span>
            <span className="w-16 text-right">Actions</span>
          </div>
          {filteredFiles.map((file) => (
            <FileListRow
              key={file._id}
              file={file}
              onPreview={openPreview}
              onShare={(f) => openShare(f, "file")}
              onMove={(f) => openMove(f, "file")}
              onRename={() => {}}
              onDelete={(f) => setDeleteTarget(f)}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
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
