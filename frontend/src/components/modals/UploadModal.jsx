import React, { useState, useRef } from "react";
import {
  UploadCloud,
  X,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Filter,
  Check,
} from "lucide-react";
import { fileApi } from "../../services/api";

export const UploadModal = ({ isOpen, onClose, currentFolderId, onUploadComplete }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => {
        const existingNames = new Set(prev.map((f) => f.name));
        const combined = [...prev];
        for (const file of newFiles) {
          if (!existingNames.has(file.name)) {
            combined.push(file);
          }
        }
        return combined;
      });
      setError("");
    }
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    setSelectedFiles([]);
  };

  const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return "--";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const totalBatchSize = selectedFiles.reduce((acc, f) => acc + (f.size || 0), 0);

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      setUploading(true);
      setError("");
      setFeedback("");
      setProgress(20);

      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      if (currentFolderId) {
        formData.append("folder", currentFolderId);
      }
      formData.append("skipDuplicates", String(skipDuplicates));

      setProgress(60);
      const res = await fileApi.upload(formData);
      setProgress(100);

      setFeedback(res.message || "Upload completed successfully!");

      setTimeout(() => {
        setSelectedFiles([]);
        setProgress(0);
        setFeedback("");
        onClose();
        if (onUploadComplete) onUploadComplete();
      }, 700);
    } catch (err) {
      setError(err.message || "Failed to upload files");
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="max-w-lg w-full bg-white dark:bg-[#0c101a] border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto scrollbar-thin">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 dark:text-indigo-400 flex items-center justify-center">
              <UploadCloud size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">Upload Files</h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Batch upload multiple documents, images, archives or code files
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={uploading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {feedback && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 size={15} className="shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Dropzone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-indigo-500/50 bg-slate-50 hover:bg-slate-100/70 dark:bg-[#0d101a] dark:hover:bg-[#111624] rounded-2xl p-7 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 group"
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 dark:text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <UploadCloud size={24} />
          </div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            Click to browse or drag multiple files here
          </p>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
            Supports any file format: Documents, Media, Code files, Zip Archives
          </p>
        </div>

        {/* Duplicate Skip Toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] text-xs">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-indigo-500" />
            <div>
              <span className="font-semibold text-slate-800 dark:text-zinc-200">Skip Duplicates</span>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                Automatically skip files that already exist in this folder
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSkipDuplicates((prev) => !prev)}
            className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
              skipDuplicates ? "bg-indigo-600" : "bg-slate-300 dark:bg-zinc-700"
            }`}
          >
            <div
              className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.75 transition-transform ${
                skipDuplicates ? "left-4.5" : "left-0.75"
              }`}
            />
          </button>
        </div>

        {/* Selected Files List */}
        {selectedFiles.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-zinc-400 px-1">
              <span>QUEUED FILES ({selectedFiles.length}) • TOTAL {formatFileSize(totalBatchSize)}</span>
              {!uploading && (
                <button
                  type="button"
                  onClick={clearAllFiles}
                  className="text-red-500 hover:text-red-600 dark:text-red-400 text-[10px] font-medium cursor-pointer"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="flex flex-col gap-1.5 max-h-44 overflow-y-auto scrollbar-thin pr-1">
              {selectedFiles.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] text-xs"
                >
                  <div className="flex items-center gap-2.5 truncate flex-1 mr-3">
                    <FileText size={15} className="text-indigo-500 dark:text-indigo-400 shrink-0" />
                    <span className="text-slate-800 dark:text-zinc-200 truncate font-medium">{f.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-500">
                      {formatFileSize(f.size)}
                    </span>
                    {!uploading && (
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="p-1 rounded text-slate-400 hover:text-red-600 dark:text-zinc-500 dark:hover:text-red-400 transition-colors cursor-pointer"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Progress Bar */}
        {uploading && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-zinc-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Loader2 size={13} className="animate-spin text-indigo-500" />
                Uploading files to SkyDriveX...
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">{progress}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-white/[0.06]">
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] text-xs font-semibold cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading || selectedFiles.length === 0}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold shadow-md shadow-indigo-500/25 transition-all cursor-pointer"
          >
            {uploading ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <span>Upload {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ""}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;
