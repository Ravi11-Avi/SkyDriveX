import React, { useState, useEffect } from "react";
import {
  X,
  Download,
  Share2,
  FileText,
  Calendar,
  HardDrive,
  Tag,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { fileApi } from "../../services/api";

export const FilePreviewModal = ({ isOpen, onClose, file, onShare }) => {
  const [viewUrl, setViewUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [textContent, setTextContent] = useState(null);

  useEffect(() => {
    if (!isOpen || !file) {
      setViewUrl(null);
      setTextContent(null);
      return;
    }

    let isMounted = true;

    const fetchStreamUrl = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fileApi.getViewUrl(file._id);
        if (res.success && res.viewUrl && isMounted) {
          setViewUrl(res.viewUrl);

          // If text or code, fetch textual contents
          if (file.category === "code" || file.mimeType?.startsWith("text/")) {
            try {
              const textRes = await fetch(res.viewUrl);
              const text = await textRes.text();
              if (isMounted) setTextContent(text);
            } catch (e) {
              // Ignore text fetch error
            }
          }
        }
      } catch (err) {
        if (isMounted) setError(err.message || "Failed to load file preview");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStreamUrl();

    return () => {
      isMounted = false;
    };
  }, [isOpen, file]);

  if (!isOpen || !file) return null;

  const handleDownload = async () => {
    try {
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
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return "--";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col animate-in fade-in duration-200">
      {/* Top Action Bar */}
      <div className="h-16 px-6 bg-[#07090e]/90 border-b border-white/[0.08] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
            <FileText size={16} />
          </div>
          <div className="flex flex-col min-w-0">
            <h3 className="text-sm font-semibold text-white truncate" title={file.name}>
              {file.name}
            </h3>
            <span className="text-[11px] text-zinc-500 font-mono">
              {formatFileSize(file.size)} • {file.mimeType}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white border border-white/[0.08] text-xs font-medium transition-all cursor-pointer"
          >
            <Download size={14} />
            <span>Download</span>
          </button>

          {onShare && (
            <button
              onClick={() => onShare(file)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-500/25 transition-all cursor-pointer"
            >
              <Share2 size={14} />
              <span>Share</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer ml-1"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Media Center Stage */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 overflow-auto">
        {loading ? (
          <div className="flex flex-col items-center gap-3 text-zinc-500">
            <Loader2 size={32} className="animate-spin text-indigo-500" />
            <p className="text-xs font-medium">Decrypting file preview...</p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
            {error}
          </div>
        ) : viewUrl ? (
          <div className="max-w-4xl max-h-full flex items-center justify-center">
            {file.category === "image" && (
              <img
                src={viewUrl}
                alt={file.name}
                className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl border border-white/10"
              />
            )}

            {file.category === "video" && (
              <video
                src={viewUrl}
                controls
                autoPlay
                className="max-h-[75vh] max-w-full rounded-2xl shadow-2xl border border-white/10"
              />
            )}

            {file.category === "audio" && (
              <div className="p-8 rounded-3xl bg-[#0c101a] border border-white/10 shadow-2xl flex flex-col items-center gap-4 w-96">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                  <FileText size={32} />
                </div>
                <audio src={viewUrl} controls className="w-full" />
              </div>
            )}

            {(file.category === "code" || textContent) && (
              <div className="w-[80vw] max-w-4xl max-h-[70vh] bg-[#090d16] border border-white/10 rounded-2xl p-6 overflow-auto font-mono text-xs text-zinc-200 whitespace-pre scrollbar-thin shadow-2xl">
                {textContent || "Loading code contents..."}
              </div>
            )}

            {file.category === "document" && file.mimeType === "application/pdf" && (
              <iframe
                src={viewUrl}
                title={file.name}
                className="w-[85vw] max-w-5xl h-[75vh] rounded-2xl border border-white/10 shadow-2xl"
              />
            )}

            {file.category !== "image" &&
              file.category !== "video" &&
              file.category !== "audio" &&
              file.category !== "code" &&
              file.mimeType !== "application/pdf" && (
                <div className="p-8 rounded-3xl bg-[#0c101a] border border-white/10 shadow-2xl flex flex-col items-center text-center gap-4 max-w-sm">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <FileText size={32} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{file.name}</h4>
                    <p className="text-xs text-zinc-400 mt-1">
                      In-browser preview is not supported for this format. Download the file to open it locally.
                    </p>
                  </div>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
                  >
                    <Download size={14} />
                    <span>Download File</span>
                  </button>
                </div>
              )}
          </div>
        ) : null}
      </div>

      {/* Footer Info Bar */}
      <div className="h-12 px-6 bg-[#07090e]/90 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-500 shrink-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <HardDrive size={13} />
            {formatFileSize(file.size)}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar size={13} />
            {new Date(file.createdAt).toLocaleDateString()}
          </span>
        </div>
        <span className="font-mono text-[11px] uppercase text-zinc-600">
          Secure Object ID: {file._id}
        </span>
      </div>
    </div>
  );
};

export default FilePreviewModal;
