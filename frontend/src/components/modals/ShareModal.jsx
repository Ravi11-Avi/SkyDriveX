import React, { useState } from "react";
import {
  Share2,
  X,
  Copy,
  Check,
  Lock,
  Globe,
  Clock,
  Eye,
  Download,
  Link as LinkIcon,
  ShieldCheck,
} from "lucide-react";
import { shareApi } from "../../services/api";

export const ShareModal = ({ isOpen, onClose, item, itemType = "file" }) => {
  const [permission, setPermission] = useState("view"); // default view-only or download
  const [password, setPassword] = useState("");
  const [expiresInHours, setExpiresInHours] = useState("168"); // Default 7 days
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdShare, setCreatedShare] = useState(null);
  const [copiedPublic, setCopiedPublic] = useState(false);
  const [copiedDirect, setCopiedDirect] = useState(false);

  if (!isOpen || !item) return null;

  const handleCreateShare = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");

      const payload = {
        itemType,
        itemId: item._id,
        permission,
        password: password.trim() || undefined,
        expiresInHours: expiresInHours ? parseInt(expiresInHours, 10) : undefined,
      };

      const res = await shareApi.create(payload);
      if (res.success && res.share) {
        setCreatedShare(res.share);
      }
    } catch (err) {
      setError(err.message || "Failed to create share link");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPublic = () => {
    if (!createdShare) return;
    const url = createdShare.shareUrl || `${window.location.origin}/share/${createdShare.shareToken}`;
    navigator.clipboard.writeText(url);
    setCopiedPublic(true);
    setTimeout(() => setCopiedPublic(false), 2500);
  };

  const handleCopyDirect = () => {
    if (!createdShare || !createdShare.directViewUrl) return;
    navigator.clipboard.writeText(createdShare.directViewUrl);
    setCopiedDirect(true);
    setTimeout(() => setCopiedDirect(false), 2500);
  };

  const handleModalClose = () => {
    setCreatedShare(null);
    setPassword("");
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="max-w-md w-full bg-white dark:bg-[#0c101a] border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto scrollbar-thin">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Share2 size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">Share Resource</h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate max-w-[240px]">{item.name}</p>
            </div>
          </div>
          <button
            onClick={handleModalClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-300 text-xs">
            {error}
          </div>
        )}

        {createdShare ? (
          <div className="flex flex-col gap-4">
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <Check size={16} className="shrink-0" />
              <span>Share link generated! Anyone with this link can access the file.</span>
            </div>

            {/* Public Web Link */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-zinc-300">
                <span className="flex items-center gap-1.5">
                  <Globe size={13} className="text-indigo-500" />
                  Public Share Link (Web Viewer)
                </span>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                  {createdShare.permission === "view" ? "View Only" : "Can Download"}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#0d101a] border border-slate-200 dark:border-white/[0.08] p-1.5 rounded-xl">
                <input
                  type="text"
                  readOnly
                  value={createdShare.shareUrl || `${window.location.origin}/share/${createdShare.shareToken}`}
                  className="flex-1 bg-transparent text-xs text-slate-800 dark:text-zinc-200 px-2 outline-none font-mono truncate"
                />
                <button
                  type="button"
                  onClick={handleCopyPublic}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-all cursor-pointer shrink-0"
                >
                  {copiedPublic ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedPublic ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            {/* Direct S3 / Stream URL if available */}
            {createdShare.directViewUrl && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  <span className="flex items-center gap-1.5">
                    <LinkIcon size={13} className="text-cyan-500" />
                    Direct Storage / Stream URL
                  </span>
                  <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-medium">S3 Direct Link</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#0d101a] border border-slate-200 dark:border-white/[0.08] p-1.5 rounded-xl">
                  <input
                    type="text"
                    readOnly
                    value={createdShare.directViewUrl}
                    className="flex-1 bg-transparent text-xs text-slate-800 dark:text-zinc-200 px-2 outline-none font-mono truncate"
                  />
                  <button
                    type="button"
                    onClick={handleCopyDirect}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow transition-all cursor-pointer shrink-0"
                  >
                    {copiedDirect ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedDirect ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-white/[0.06]">
              <button
                type="button"
                onClick={handleModalClose}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateShare} className="flex flex-col gap-4 text-xs">
            {/* Permission Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-slate-700 dark:text-zinc-300">Access Permission</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPermission("view")}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    permission === "view"
                      ? "bg-indigo-50 dark:bg-indigo-500/15 border-indigo-500 text-indigo-700 dark:text-indigo-200 shadow-xs"
                      : "bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/[0.06] text-slate-600 dark:text-zinc-400"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Eye size={14} className="text-indigo-500" />
                    <span>View Only</span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-500 leading-tight">
                    Recipients can preview without downloading
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPermission("download")}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    permission === "download"
                      ? "bg-indigo-50 dark:bg-indigo-500/15 border-indigo-500 text-indigo-700 dark:text-indigo-200 shadow-xs"
                      : "bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/[0.06] text-slate-600 dark:text-zinc-400"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Download size={14} className="text-cyan-500" />
                    <span>Can Download</span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-500 leading-tight">
                    Recipients can preview and download
                  </span>
                </button>
              </div>
            </div>

            {/* Link Expiration */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Clock size={13} className="text-indigo-500" />
                <span>Link Expiration</span>
              </label>
              <select
                value={expiresInHours}
                onChange={(e) => setExpiresInHours(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0d101a] border border-slate-200 dark:border-white/[0.08] focus:border-indigo-500 text-slate-800 dark:text-zinc-100 px-3 py-2 rounded-xl outline-none"
              >
                <option value="24">Expires in 24 hours</option>
                <option value="72">Expires in 3 days</option>
                <option value="168">Expires in 7 days (Recommended)</option>
                <option value="720">Expires in 30 days</option>
                <option value="">Never expires</option>
              </select>
            </div>

            {/* Optional Password Protection */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lock size={13} className="text-indigo-500" />
                  Password Protection (Optional)
                </span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500">Min 4 chars</span>
              </label>
              <input
                type="password"
                placeholder="Leave blank for public open access"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0d101a] border border-slate-200 dark:border-white/[0.08] focus:border-indigo-500 text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 px-3 py-2 rounded-xl outline-none"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-white/[0.06]">
              <button
                type="button"
                onClick={handleModalClose}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-500/25 transition-all cursor-pointer"
              >
                <Share2 size={13} />
                <span>{loading ? "Generating..." : "Generate Share Link"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ShareModal;
