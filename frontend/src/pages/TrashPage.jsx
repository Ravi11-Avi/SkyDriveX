import React, { useState, useEffect, useCallback } from "react";
import {
  Trash2,
  RotateCcw,
  Folder,
  FileText,
  RefreshCw,
  Info,
} from "lucide-react";
import { trashApi, folderApi, fileApi } from "../services/api";
import ConfirmModal from "../components/modals/ConfirmModal";

export default function TrashPage() {
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  const showToast = (message, type = "success") => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const loadTrash = useCallback(async () => {
    try {
      setLoading(true);
      const res = await trashApi.getItems();
      if (res.success) {
        setFolders(res.folders || []);
        setFiles(res.files || []);
      }
    } catch (err) {
      showToast(err.message || "Failed to load trash items", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrash();
  }, [loadTrash]);

  const handleRestoreFolder = async (folder) => {
    try {
      setProcessingId(folder._id);
      await folderApi.restore(folder._id);
      setFolders((prev) => prev.filter((f) => f._id !== folder._id));
      showToast(`Restored folder "${folder.name}"`);
    } catch (err) {
      showToast(err.message || "Failed to restore folder", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRestoreFile = async (file) => {
    try {
      setProcessingId(file._id);
      await fileApi.restore(file._id);
      setFiles((prev) => prev.filter((f) => f._id !== file._id));
      showToast(`Restored "${file.name}"`);
    } catch (err) {
      showToast(err.message || "Failed to restore file", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteFolderPermanently = (folder) => {
    setConfirmModal({
      title: "Permanently Delete Folder?",
      message: `Are you sure you want to permanently delete "${folder.name}" and all of its contents? This action CANNOT be undone.`,
      confirmLabel: "Delete Forever",
      isDestructive: true,
      onConfirm: async () => {
        try {
          setProcessingId(folder._id);
          await folderApi.deletePermanently(folder._id);
          setFolders((prev) => prev.filter((f) => f._id !== folder._id));
          showToast(`Permanently deleted folder "${folder.name}"`);
        } catch (err) {
          showToast(err.message || "Failed to delete folder", "error");
        } finally {
          setProcessingId(null);
          setConfirmModal(null);
        }
      },
    });
  };

  const handleDeleteFilePermanently = (file) => {
    setConfirmModal({
      title: "Permanently Delete File?",
      message: `Are you sure you want to permanently delete "${file.name}"? This file will be removed from Cloud Storage immediately.`,
      confirmLabel: "Delete Forever",
      isDestructive: true,
      onConfirm: async () => {
        try {
          setProcessingId(file._id);
          await fileApi.deletePermanently(file._id);
          setFiles((prev) => prev.filter((f) => f._id !== file._id));
          showToast(`Permanently deleted "${file.name}"`);
        } catch (err) {
          showToast(err.message || "Failed to delete file", "error");
        } finally {
          setProcessingId(null);
          setConfirmModal(null);
        }
      },
    });
  };

  const handleEmptyTrash = () => {
    setConfirmModal({
      title: "Empty Trash Completely?",
      message:
        "All folders and files currently in your trash will be permanently wiped from SkyDriveX and cloud storage. Are you absolutely certain?",
      confirmLabel: "Empty Trash",
      isDestructive: true,
      onConfirm: async () => {
        try {
          await trashApi.emptyTrash();
          setFolders([]);
          setFiles([]);
          showToast("Trash has been emptied");
        } catch (err) {
          showToast(err.message || "Failed to empty trash", "error");
        } finally {
          setConfirmModal(null);
        }
      },
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return "--";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "--";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-red-500/10 text-red-400 border border-red-500/20">
            <Trash2 size={22} className="stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-['Outfit'] text-white">
              Trash & Retention
            </h1>
            <p className="text-xs text-zinc-400">
              Items in Trash are scheduled for permanent purge after 30 days ({totalCount} items)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadTrash}
            title="Refresh Trash"
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white border border-white/[0.08] transition-colors cursor-pointer"
          >
            <RefreshCw size={15} className={loading ? "animate-spin text-indigo-400" : ""} />
          </button>
          {totalCount > 0 && (
            <button
              onClick={handleEmptyTrash}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/25 text-xs font-medium transition-all cursor-pointer"
            >
              <Trash2 size={14} />
              <span>Empty Trash</span>
            </button>
          )}
        </div>
      </div>

      {/* Retention Policy Banner */}
      <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200 flex items-start gap-3">
        <Info size={18} className="text-indigo-400 shrink-0 mt-0.5" />
        <p>
          <strong className="text-white">Automatic Retention Policy:</strong> Trashed items remain safely recoverable for 30 days. You can restore them back to their original locations or purge them immediately to free up cloud storage quota.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-500">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-xs font-medium">Checking trash contents...</p>
        </div>
      ) : totalCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 border border-white/5 flex items-center justify-center text-zinc-500 mb-4">
            <Trash2 size={32} className="stroke-[1.6]" />
          </div>
          <h3 className="text-lg font-bold font-['Outfit'] text-white mb-1">
            Trash is empty
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm">
            Items you delete from your drive will appear here before being permanently destroyed.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-[#0c0f17]/90 border border-white/[0.07] shadow-xl">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] text-zinc-500 uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Item Name</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Size</th>
                <th className="py-3.5 px-4">Trashed Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {/* Folders */}
              {folders.map((folder) => (
                <tr key={folder._id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{
                          backgroundColor: folder.color ? `${folder.color}20` : "rgba(99, 102, 241, 0.2)",
                          color: folder.color || "#6366f1",
                        }}
                      >
                        <Folder size={16} />
                      </div>
                      <span className="font-semibold text-zinc-100">{folder.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      Folder
                    </span>
                  </td>
                  <td className="py-3 px-4 text-zinc-500">--</td>
                  <td className="py-3 px-4 text-zinc-400">
                    {formatDate(folder.trashedAt || folder.updatedAt)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleRestoreFolder(folder)}
                        disabled={processingId === folder._id}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-medium transition-all cursor-pointer"
                        title="Restore"
                      >
                        <RotateCcw size={13} />
                        <span>Restore</span>
                      </button>
                      <button
                        onClick={() => handleDeleteFolderPermanently(folder)}
                        disabled={processingId === folder._id}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-medium transition-all cursor-pointer"
                        title="Delete Forever"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {/* Files */}
              {files.map((file) => (
                <tr key={file._id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-zinc-800/80 text-zinc-300">
                        <FileText size={16} />
                      </div>
                      <span className="font-semibold text-zinc-100">{file.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                      {file.category || "File"}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-zinc-400">
                    {formatFileSize(file.size)}
                  </td>
                  <td className="py-3 px-4 text-zinc-400">
                    {formatDate(file.trashedAt || file.updatedAt)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleRestoreFile(file)}
                        disabled={processingId === file._id}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-medium transition-all cursor-pointer"
                        title="Restore"
                      >
                        <RotateCcw size={13} />
                        <span>Restore</span>
                      </button>
                      <button
                        onClick={() => handleDeleteFilePermanently(file)}
                        disabled={processingId === file._id}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-medium transition-all cursor-pointer"
                        title="Delete Forever"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Modal */}
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
