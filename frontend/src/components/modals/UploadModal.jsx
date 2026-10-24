import React, { useState, useRef } from "react";
import { UploadCloud, X, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { fileApi } from "../../services/api";

export const UploadModal = ({ isOpen, onClose, currentFolderId, onUploadComplete }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
      setError("");
    }
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return "--";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      setUploading(true);
      setError("");
      setProgress(20);

      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      if (currentFolderId) {
        formData.append("folder", currentFolderId);
      }

      setProgress(60);
      await fileApi.upload(formData);
      setProgress(100);

      setTimeout(() => {
        setSelectedFiles([]);
        setProgress(0);
        onClose();
        if (onUploadComplete) onUploadComplete();
      }, 500);
    } catch (err) {
      setError(err.message || "Failed to upload files");
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="max-w-lg w-full bg-[#0c101a] border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <UploadCloud size={18} />
            </div>
            <h3 className="text-base font-bold text-white">Upload Files</h3>
          </div>
          <button
            onClick={onClose}
            disabled={uploading}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Dropzone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-white/10 hover:border-indigo-500/50 bg-[#0d101a] hover:bg-[#111624] rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200"
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3">
            <UploadCloud size={24} />
          </div>
          <p className="text-sm font-semibold text-white">
            Click to browse or drag files here
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">
            Supports any file format: Documents, Media, Compressed Archives, Code
          </p>
        </div>

        {/* Selected Files List */}
        {selectedFiles.length > 0 && (
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto scrollbar-thin">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Selected Files ({selectedFiles.length})
            </span>
            {selectedFiles.map((f, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.05] text-xs"
              >
                <div className="flex items-center gap-2.5 truncate flex-1 mr-3">
                  <FileText size={15} className="text-indigo-400 shrink-0" />
                  <span className="text-zinc-200 truncate font-medium">{f.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-mono text-zinc-500">
                    {formatFileSize(f.size)}
                  </span>
                  {!uploading && (
                    <button
                      onClick={() => removeFile(i)}
                      className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Progress bar */}
        {uploading && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Loader2 size={13} className="animate-spin text-indigo-400" />
                Uploading to SkyDriveX...
              </span>
              <span className="font-semibold text-white">{progress}%</span>
            </div>
            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.06]">
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 rounded-xl bg-white/[0.04] text-zinc-300 hover:text-white text-xs font-medium cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading || selectedFiles.length === 0}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold shadow-md shadow-indigo-500/25 transition-all cursor-pointer"
          >
            {uploading ? "Uploading..." : `Upload ${selectedFiles.length > 0 ? `(${selectedFiles.length})` : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;
