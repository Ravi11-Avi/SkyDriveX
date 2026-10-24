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
  Copy,
  Check,
  Code2,
  FileCode,
  ExternalLink,
} from "lucide-react";
import { fileApi } from "../../services/api";

export const FilePreviewModal = ({ isOpen, onClose, file, onShare }) => {
  const [viewUrl, setViewUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [textContent, setTextContent] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

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
          const isCodeOrText =
            file.category === "code" ||
            file.mimeType?.startsWith("text/") ||
            /\.(js|jsx|ts|tsx|py|html|css|json|md|cpp|c|java|go|rs|sql|sh|yml|yaml|xml|env)$/i.test(
              file.name || ""
            );

          if (isCodeOrText) {
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

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

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

  const handleCopyCode = () => {
    if (!textContent) return;
    navigator.clipboard.writeText(textContent);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return "--";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const isCode =
    file.category === "code" ||
    /\.(js|jsx|ts|tsx|py|html|css|json|md|cpp|c|java|go|rs|sql|sh|yml|yaml|xml|env)$/i.test(
      file.name || ""
    );

  const codeLines = textContent ? textContent.split("\n") : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="h-16 px-4 sm:px-6 bg-white/95 dark:bg-[#07090e]/90 border-b border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between shrink-0 transition-colors">
        <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            {isCode ? <Code2 size={17} /> : <FileText size={17} />}
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate" title={file.name}>
                {file.name}
              </h3>
              {isCode && (
                <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-mono uppercase font-bold">
                  {file.extension || "code"}
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-zinc-500 font-mono">
              {formatFileSize(file.size)} • {file.mimeType} {codeLines.length ? `• ${codeLines.length} lines` : ""}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {textContent && (
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-white/[0.08] text-xs font-medium transition-all cursor-pointer"
              title="Copy code to clipboard"
            >
              {copiedCode ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              <span className="hidden sm:inline">{copiedCode ? "Copied" : "Copy"}</span>
            </button>
          )}

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-white/[0.08] text-xs font-medium transition-all cursor-pointer"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Download</span>
          </button>

          {onShare && (
            <button
              onClick={() => onShare(file, "file")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-500/25 transition-all cursor-pointer"
            >
              <Share2 size={14} />
              <span>Share</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer ml-1"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Media Center Stage */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 overflow-auto">
        {loading ? (
          <div className="flex flex-col items-center gap-3 text-slate-400 dark:text-zinc-500">
            <Loader2 size={32} className="animate-spin text-indigo-500" />
            <p className="text-xs font-medium">Loading file preview...</p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-300 text-xs max-w-md text-center">
            {error}
          </div>
        ) : viewUrl ? (
          <div className="max-w-5xl max-h-full w-full flex items-center justify-center">
            {/* Image Preview */}
            {file.category === "image" && (
              <img
                src={viewUrl}
                alt={file.name}
                className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10"
              />
            )}

            {/* Video Preview */}
            {file.category === "video" && (
              <video
                src={viewUrl}
                controls
                autoPlay
                className="max-h-[75vh] max-w-full rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10"
              />
            )}

            {/* Audio Preview */}
            {file.category === "audio" && (
              <div className="p-8 rounded-3xl bg-white dark:bg-[#0c101a] border border-slate-200 dark:border-white/10 shadow-2xl flex flex-col items-center gap-4 w-96">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <FileText size={32} />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-xs">{file.name}</h4>
                <audio src={viewUrl} controls className="w-full" />
              </div>
            )}

            {/* GitHub-Style Code & Text File Viewer */}
            {(isCode || textContent) && (
              <div className="w-full max-w-4xl max-h-[75vh] bg-[#f6f8fa] dark:bg-[#0d1117] border border-slate-300 dark:border-[#30363d] rounded-2xl overflow-hidden shadow-2xl flex flex-col font-mono text-xs">
                {/* GitHub Code Viewer Header */}
                <div className="h-10 px-4 bg-[#eaeef2] dark:bg-[#161b22] border-b border-slate-300 dark:border-[#30363d] flex items-center justify-between text-[11px] text-slate-600 dark:text-[#8b949e]">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-800 dark:text-[#c9d1d9]">{file.name}</span>
                    <span>{codeLines.length} lines</span>
                    <span>{formatFileSize(file.size)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyCode}
                      className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      {copiedCode ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                      <span>{copiedCode ? "Copied" : "Copy raw"}</span>
                    </button>
                  </div>
                </div>

                {/* Code Body with Line Numbers */}
                <div className="flex-1 overflow-auto p-4 flex gap-4 text-slate-900 dark:text-[#c9d1d9] leading-relaxed scrollbar-thin select-text">
                  {/* Line Numbers */}
                  <div className="flex flex-col text-right select-none text-slate-400 dark:text-[#484f58] pr-3 border-r border-slate-200 dark:border-[#30363d] shrink-0">
                    {codeLines.map((_, i) => (
                      <span key={i} className="leading-relaxed">
                        {i + 1}
                      </span>
                    ))}
                  </div>

                  {/* Code Lines */}
                  <pre className="flex-1 overflow-x-auto whitespace-pre font-mono m-0 p-0">
                    {textContent || "Loading code contents..."}
                  </pre>
                </div>
              </div>
            )}

            {/* PDF Viewer */}
            {file.category === "document" && file.mimeType === "application/pdf" && !textContent && (
              <iframe
                src={viewUrl}
                title={file.name}
                className="w-[85vw] max-w-5xl h-[75vh] rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl bg-white"
              />
            )}

            {/* Generic Fallback */}
            {file.category !== "image" &&
              file.category !== "video" &&
              file.category !== "audio" &&
              !isCode &&
              !textContent &&
              file.mimeType !== "application/pdf" && (
                <div className="p-8 rounded-3xl bg-white dark:bg-[#0c101a] border border-slate-200 dark:border-white/10 shadow-2xl flex flex-col items-center text-center gap-4 max-w-sm">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <FileText size={32} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{file.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                      Direct in-browser viewer is not supported for this file format. Download to open locally.
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
      <div className="h-12 px-6 bg-white/90 dark:bg-[#07090e]/90 border-t border-slate-200/80 dark:border-white/[0.06] flex items-center justify-between text-xs text-slate-500 dark:text-zinc-500 shrink-0">
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
        <span className="font-mono text-[11px] uppercase text-slate-400 dark:text-zinc-600">
          SkyDriveX Object ID: {file._id}
        </span>
      </div>
    </div>
  );
};

export default FilePreviewModal;
