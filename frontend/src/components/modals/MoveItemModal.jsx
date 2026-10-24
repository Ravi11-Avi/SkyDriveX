import React, { useState, useEffect } from "react";
import { FolderSymlink, X, Folder, HardDrive, Check, Loader2 } from "lucide-react";
import { folderApi, fileApi } from "../../services/api";

export const MoveItemModal = ({ isOpen, onClose, item, itemType = "file", onMoved }) => {
  const [folders, setFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState(null); // null = My Drive root
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const fetchAllFolders = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await folderApi.getContents(null);
        if (res.success) {
          // Exclude self if item is folder
          const validFolders = (res.folders || []).filter(
            (f) => itemType !== "folder" || f._id !== item?._id
          );
          setFolders(validFolders);
        }
      } catch (err) {
        setError(err.message || "Failed to load directory tree");
      } finally {
        setLoading(false);
      }
    };

    fetchAllFolders();
  }, [isOpen, item, itemType]);

  if (!isOpen || !item) return null;

  const handleMove = async () => {
    try {
      setSubmitting(true);
      setError("");

      if (itemType === "folder") {
        await folderApi.move(item._id, selectedFolderId);
      } else {
        await fileApi.move(item._id, selectedFolderId);
      }

      onClose();
      if (onMoved) onMoved();
    } catch (err) {
      setError(err.message || "Failed to move item");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="max-w-md w-full bg-[#0c101a] border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center">
              <FolderSymlink size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">Move Item</h3>
              <p className="text-[11px] text-zinc-400 truncate max-w-[240px]">{item.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-zinc-300">Select Destination</span>
          <div className="max-h-60 overflow-y-auto scrollbar-thin flex flex-col gap-1.5 p-1">
            {/* Root Option */}
            <div
              onClick={() => setSelectedFolderId(null)}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer text-xs ${
                selectedFolderId === null
                  ? "bg-indigo-500/15 border-indigo-500 text-indigo-300 shadow-sm"
                  : "bg-white/[0.03] border-white/[0.05] text-zinc-300 hover:bg-white/[0.06]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <HardDrive size={15} className="text-indigo-400" />
                <span className="font-semibold">My Drive (Root Directory)</span>
              </div>
              {selectedFolderId === null && <Check size={14} className="text-indigo-400" />}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-6 text-zinc-500">
                <Loader2 size={20} className="animate-spin text-indigo-500" />
              </div>
            ) : (
              folders.map((f) => (
                <div
                  key={f._id}
                  onClick={() => setSelectedFolderId(f._id)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer text-xs ${
                    selectedFolderId === f._id
                      ? "bg-indigo-500/15 border-indigo-500 text-indigo-300 shadow-sm"
                      : "bg-white/[0.03] border-white/[0.05] text-zinc-300 hover:bg-white/[0.06]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Folder
                      size={15}
                      style={{ color: f.color || "#6366f1" }}
                      className="fill-current opacity-80"
                    />
                    <span className="font-medium truncate max-w-[220px]">{f.name}</span>
                  </div>
                  {selectedFolderId === f._id && <Check size={14} className="text-indigo-400" />}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.06]">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-xl bg-white/[0.04] text-zinc-300 hover:text-white text-xs font-medium cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleMove}
            disabled={submitting}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-500/25 transition-all cursor-pointer"
          >
            {submitting ? "Moving..." : "Move Here"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoveItemModal;
