import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Star, RefreshCw, Inbox } from "lucide-react";
import { folderApi, fileApi } from "../services/api";
import FolderCard from "../components/drive/FolderCard";
import FileCard from "../components/drive/FileCard";
import FileListRow from "../components/drive/FileListRow";
import ShareModal from "../components/modals/ShareModal";
import FilePreviewModal from "../components/modals/FilePreviewModal";
import MoveItemModal from "../components/modals/MoveItemModal";
import ConfirmModal from "../components/modals/ConfirmModal";

export default function FavoritesPage() {
  const navigate = useNavigate();
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // Modals state
  const [shareItem, setShareItem] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [moveItem, setMoveItem] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);

  const showToast = (message, type = "success") => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const loadFavorites = useCallback(async () => {
    try {
      setLoading(true);
      const res = await folderApi.getContents({ isFavorite: "true" });
      if (res.success) {
        setFolders(res.folders || []);
        setFiles(res.files || []);
      }
    } catch (err) {
      showToast(err.message || "Failed to load favorites", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const handleToggleFavoriteFolder = async (folder) => {
    try {
      await folderApi.update(folder._id, { isFavorite: !folder.isFavorite });
      setFolders((prev) => prev.filter((f) => f._id !== folder._id));
      showToast("Removed from favorites");
    } catch (err) {
      showToast(err.message || "Failed to update favorite status", "error");
    }
  };

  const handleToggleFavoriteFile = async (file) => {
    try {
      await fileApi.update(file._id, { isFavorite: !file.isFavorite });
      setFiles((prev) => prev.filter((f) => f._id !== file._id));
      showToast("Removed from favorites");
    } catch (err) {
      showToast(err.message || "Failed to update favorite status", "error");
    }
  };

  const handleTrashFolder = (folder) => {
    setConfirmModal({
      title: "Move to Trash?",
      message: `Are you sure you want to move folder "${folder.name}" to Trash?`,
      confirmLabel: "Move to Trash",
      isDestructive: true,
      onConfirm: async () => {
        try {
          await folderApi.trash(folder._id);
          setFolders((prev) => prev.filter((f) => f._id !== folder._id));
          showToast(`Moved "${folder.name}" to Trash`);
        } catch (err) {
          showToast(err.message || "Failed to trash folder", "error");
        } finally {
          setConfirmModal(null);
        }
      },
    });
  };

  const handleTrashFile = (file) => {
    setConfirmModal({
      title: "Move to Trash?",
      message: `Are you sure you want to move "${file.name}" to Trash?`,
      confirmLabel: "Move to Trash",
      isDestructive: true,
      onConfirm: async () => {
        try {
          await fileApi.trash(file._id);
          setFiles((prev) => prev.filter((f) => f._id !== file._id));
          showToast(`Moved "${file.name}" to Trash`);
        } catch (err) {
          showToast(err.message || "Failed to trash file", "error");
        } finally {
          setConfirmModal(null);
        }
      },
    });
  };

  const totalCount = folders.length + files.length;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-2xl border text-sm font-medium shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-200 ${
            feedback.type === "error"
              ? "bg-red-500/10 border-red-500/20 text-red-300"
              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-white/[0.06]">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-amber-400/10 text-amber-500 dark:text-amber-400 border border-amber-400/20">
            <Star size={22} className="stroke-[2.2] fill-amber-400/20" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-['Outfit'] text-slate-900 dark:text-white">
              Starred Items
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Quick access to your {totalCount} favorite {totalCount === 1 ? "item" : "items"}
            </p>
          </div>
        </div>

        <button
          onClick={loadFavorites}
          title="Refresh"
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white border border-slate-200/80 dark:border-white/[0.08] transition-colors cursor-pointer"
        >
          <RefreshCw size={15} className={loading ? "animate-spin text-indigo-500" : ""} />
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400 dark:text-zinc-500">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-xs font-medium">Loading favorites...</p>
        </div>
      ) : totalCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-500 dark:text-amber-400 mb-4">
            <Star size={32} className="stroke-[1.6]" />
          </div>
          <h3 className="text-lg font-bold font-['Outfit'] text-slate-900 dark:text-white mb-1">
            No favorite items yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mb-6">
            Click the star icon on any folder or file across your drive to bookmark it here for quick access.
          </p>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
          >
            <span>Browse My Drive</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Starred Folders */}
          {folders.length > 0 && (
            <section className="flex flex-col gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Starred Folders ({folders.length})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {folders.map((f) => (
                  <FolderCard
                    key={f._id}
                    folder={f}
                    onClick={() => navigate(`/folder/${f._id}`)}
                    onShare={(folder) => setShareItem({ type: "folder", item: folder })}
                    onMove={(folder) => setMoveItem({ type: "folder", item: folder })}
                    onRename={() => {}}
                    onTrash={handleTrashFolder}
                    onToggleFavorite={handleToggleFavoriteFolder}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Starred Files */}
          {files.length > 0 && (
            <section className="flex flex-col gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Starred Files ({files.length})
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                {files.map((file) => (
                  <FileCard
                    key={file._id}
                    file={file}
                    onPreview={(f) => setPreviewFile(f)}
                    onShare={(f) => setShareItem({ type: "file", item: f })}
                    onMove={(f) => setMoveItem({ type: "file", item: f })}
                    onRename={() => {}}
                    onTrash={handleTrashFile}
                    onToggleFavorite={handleToggleFavoriteFile}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Modals */}
      {shareItem && (
        <ShareModal
          isOpen={true}
          item={shareItem.item}
          itemType={shareItem.type}
          onClose={() => setShareItem(null)}
        />
      )}

      {previewFile && (
        <FilePreviewModal
          isOpen={true}
          file={previewFile}
          onClose={() => setPreviewFile(null)}
          onShare={(f) => setShareItem({ type: "file", item: f })}
        />
      )}

      {moveItem && (
        <MoveItemModal
          isOpen={true}
          item={moveItem.item}
          itemType={moveItem.type}
          onClose={() => setMoveItem(null)}
          onMoved={loadFavorites}
        />
      )}

      {confirmModal && (
        <ConfirmModal
          isOpen={true}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmLabel}
          onConfirm={confirmModal.onConfirm}
          onClose={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
}
