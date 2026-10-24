import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Cloud,
  Lock,
  Unlock,
  Download,
  Eye,
  FileText,
  Folder,
  AlertTriangle,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { shareApi, folderApi } from "../services/api";

export default function PublicSharePage() {
  const { token } = useParams();

  const [loading, setLoading] = useState(true);
  const [shareData, setShareData] = useState(null);
  const [error, setError] = useState(null);

  // Password challenge state
  const [password, setPassword] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [shareAccessToken, setShareAccessToken] = useState(
    sessionStorage.getItem(`share_token_${token}`) || null
  );

  // File preview / media stream URL
  const [previewMediaUrl, setPreviewMediaUrl] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const fetchShareDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await shareApi.getPublicShare(token);

      if (res.success) {
        setShareData(res);

        // If not password protected and is a file, automatically fetch view URL
        if (!res.requiresPassword && res.itemType === "file") {
          fetchFileStream(null);
        }
      }
    } catch (err) {
      setError(err.message || "Failed to load shared item");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchFileStream = async (tokenOverride) => {
    try {
      const activeToken = tokenOverride || shareAccessToken;
      const res = await shareApi.viewShared(token, activeToken);
      if (res.success && res.viewUrl) {
        setPreviewMediaUrl(res.viewUrl);
      }
    } catch (e) {
      // Stream preview not available or not supported for this type
    }
  };

  useEffect(() => {
    fetchShareDetails();
  }, [fetchShareDetails]);

  const handleVerifyPassword = async (e) => {
    e.preventDefault();
    if (!password.trim()) return;

    try {
      setVerifying(true);
      setPasswordError("");
      const res = await shareApi.verifyPassword(token, password);

      if (res.success) {
        setShareAccessToken(res.shareAccessToken);
        sessionStorage.setItem(`share_token_${token}`, res.shareAccessToken);
        setShareData((prev) => ({
          ...prev,
          requiresPassword: false,
          item: res.item,
          subfolders: res.subfolders || [],
          files: res.files || [],
          permission: res.permission,
          itemType: res.itemType,
        }));

        if (res.itemType === "file") {
          fetchFileStream(res.shareAccessToken);
        }
      }
    } catch (err) {
      setPasswordError(err.message || "Incorrect password");
    } finally {
      setVerifying(false);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      if (shareData.itemType === "file") {
        const res = await shareApi.downloadShared(token, shareAccessToken);
        if (res.success && res.downloadUrl) {
          const a = document.createElement("a");
          a.href = res.downloadUrl;
          a.download = res.fileName || shareData.item?.originalName || "download";
          document.body.appendChild(a);
          a.click();
          a.remove();
        }
      } else {
        // Folder download as ZIP
        const zipUrl = folderApi.getZipDownloadUrl(shareData.item._id);
        window.open(zipUrl, "_blank");
      }
    } catch (err) {
      alert(err.message || "Failed to download item");
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

  if (loading) {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center bg-[#06080d] text-zinc-400">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-indigo-500" />
          <p className="text-xs font-medium">Decrypting shared resource...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center p-4 bg-[#06080d] text-slate-100">
        <div className="max-w-md w-full p-8 rounded-3xl bg-[#0c0f17]/90 border border-white/[0.08] shadow-2xl flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mb-2">
            <AlertTriangle size={28} />
          </div>
          <h2 className="text-lg font-bold font-['Outfit'] text-white">Access Restricted</h2>
          <p className="text-xs text-zinc-400 max-w-xs">{error}</p>
          <Link
            to="/"
            className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all"
          >
            Return to SkyDriveX
          </Link>
        </div>
      </div>
    );
  }

  const { requiresPassword, itemType, item, subfolders, files, permission } = shareData;

  return (
    <div className="min-h-screen w-screen flex flex-col bg-slate-50 dark:bg-[#06080d] text-slate-900 dark:text-slate-100 relative overflow-x-hidden font-sans transition-colors duration-200">
      {/* Background Ambient Radial Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-indigo-500/15 via-violet-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="h-16 px-6 bg-white/80 dark:bg-[#07090e]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/[0.06] flex items-center justify-between z-20">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md">
            <Cloud size={18} className="stroke-[2.2]" />
          </div>
          <span className="font-['Outfit'] font-bold text-lg text-slate-900 dark:text-white">
            SkyDrive<span className="text-indigo-600 dark:text-indigo-400">X</span>
          </span>
        </Link>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
          <ShieldCheck size={14} />
          <span>Encrypted Public Transfer</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 z-10">
        {requiresPassword ? (
          /* Password Card */
          <div className="w-full max-w-md p-8 rounded-3xl bg-white dark:bg-[#0c0f17]/90 border border-slate-200 dark:border-white/[0.08] shadow-2xl backdrop-blur-2xl flex flex-col items-center text-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-500 dark:text-amber-400 flex items-center justify-center shadow-lg">
              <Lock size={26} />
            </div>
            <div>
              <h2 className="text-lg font-bold font-['Outfit'] text-slate-900 dark:text-white">Password Protected</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                The owner has secured this {itemType === "file" ? "file" : "folder"} with a passcode.
              </p>
            </div>

            {passwordError && (
              <div className="w-full p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle size={15} className="shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyPassword} className="w-full flex flex-col gap-3 text-xs">
              <input
                type="password"
                required
                autoFocus
                placeholder="Enter security password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-center bg-slate-50 dark:bg-[#0d101a] border border-slate-200 dark:border-white/[0.08] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 px-4 py-2.5 rounded-xl outline-none"
              />
              <button
                type="submit"
                disabled={verifying || !password}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-semibold text-xs shadow-lg shadow-indigo-500/25 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {verifying ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Unlock size={15} />
                    <span>Unlock Content</span>
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Unlocked Content Card */
          <div className="w-full max-w-xl p-8 rounded-3xl bg-white dark:bg-[#0c0f17]/90 border border-slate-200 dark:border-white/[0.08] shadow-2xl backdrop-blur-2xl flex flex-col gap-6">
            {/* Header info */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                {itemType === "folder" ? <Folder size={30} /> : <FileText size={30} />}
              </div>
              <div className="flex flex-col min-w-0">
                <h2 className="text-lg font-bold font-['Outfit'] text-slate-900 dark:text-white truncate">
                  {item?.name || "Shared Item"}
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  {itemType === "file" && (
                    <>
                      <span>{formatFileSize(item?.size)}</span>
                      <span>•</span>
                      <span className="uppercase font-semibold text-indigo-600 dark:text-indigo-400">
                        {item?.category || "File"}
                      </span>
                    </>
                  )}
                  {itemType === "folder" && (
                    <span>
                      Shared Folder ({(subfolders?.length || 0) + (files?.length || 0)} items)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Media Preview Box */}
            {itemType === "file" && previewMediaUrl && (
              <div className="w-full rounded-2xl bg-slate-900/5 dark:bg-black/40 border border-slate-200 dark:border-white/[0.06] overflow-hidden flex items-center justify-center p-3">
                {item?.category === "image" && (
                  <img
                    src={previewMediaUrl}
                    alt={item.name}
                    className="max-h-72 w-auto object-contain rounded-xl shadow-lg"
                  />
                )}
                {item?.category === "video" && (
                  <video
                    src={previewMediaUrl}
                    controls
                    className="max-h-72 w-full rounded-xl"
                  />
                )}
                {item?.category === "audio" && (
                  <audio src={previewMediaUrl} controls className="w-full" />
                )}
              </div>
            )}

            {/* Subfolders & Files inside folder */}
            {itemType === "folder" && (
              <div className="flex flex-col gap-2 max-h-56 overflow-y-auto scrollbar-thin p-3 rounded-2xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/[0.06]">
                {subfolders?.map((sf) => (
                  <div key={sf._id} className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-zinc-300 py-1">
                    <Folder size={15} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span className="truncate">{sf.name}</span>
                  </div>
                ))}
                {files?.map((fl) => (
                  <div key={fl._id} className="flex items-center justify-between text-xs text-slate-700 dark:text-zinc-300 py-1">
                    <div className="flex items-center gap-2.5 truncate">
                      <FileText size={15} className="text-slate-400 dark:text-zinc-500 shrink-0" />
                      <span className="truncate">{fl.name}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-zinc-500 font-mono shrink-0 ml-2">
                      {formatFileSize(fl.size)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Download Button */}
            <div>
              {permission === "download" ? (
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-semibold text-sm shadow-xl shadow-indigo-500/25 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {downloading ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      <span>Preparing Download...</span>
                    </>
                  ) : (
                    <>
                      <Download size={17} />
                      <span>{itemType === "folder" ? "Download Folder as ZIP" : "Download File"}</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-white/[0.04] text-slate-500 dark:text-zinc-400 text-xs text-center flex items-center justify-center gap-2">
                  <Eye size={15} />
                  <span>This link has view-only permissions. Downloads are disabled.</span>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 dark:text-zinc-500 z-20">
        <span>Powered by </span>
        <Link to="/" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
          SkyDriveX
        </Link>
      </footer>
    </div>
  );
}
