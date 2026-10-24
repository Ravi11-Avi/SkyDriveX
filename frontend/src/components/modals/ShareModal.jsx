import React, { useState } from "react";
import {
  Share2,
  X,
  Copy,
  Check,
  Lock,
  Globe,
  Clock,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { shareApi } from "../../services/api";

export const ShareModal = ({ isOpen, onClose, item, itemType = "file" }) => {
  const [permission, setPermission] = useState("download");
  const [password, setPassword] = useState("");
  const [expiresInHours, setExpiresInHours] = useState("168"); // Default 7 days
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdShare, setCreatedShare] = useState(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !item) return null;

  const handleCreateShare = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");

      const payload = {
        itemType,
        [itemType === "folder" ? "folderId" : "fileId"]: item._id,
        permission,
        password: password.trim() || undefined,
        expiresInHours: expiresInHours ? parseInt(expiresInHours, 10) : undefined,
      };

      const res = await shareApi.create(payload);
      if (res.success) {
        setCreatedShare(res.share);
      }
    } catch (err) {
      setError(err.message || "Failed to create share link");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!createdShare) return;
    const url = `${window.location.origin}/share/${createdShare.shareToken}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleModalClose = () => {
    setCreatedShare(null);
    setPassword("");
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="max-w-md w-full bg-[#0c101a] border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 flex items-center justify-center">
              <Share2 size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">Share Resource</h3>
              <p className="text-[11px] text-zinc-400 truncate max-w-[240px]">{item.name}</p>
            </div>
          </div>
          <button
            onClick={handleModalClose}
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

        {createdShare ? (
          <div className="flex flex-col gap-4">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
              <Check size={16} className="shrink-0" />
              <span>Share link generated successfully!</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-300">Public Link</label>
              <div className="flex items-center gap-2 bg-[#0d101a] border border-white/[0.08] p-1.5 rounded-xl">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/share/${createdShare.shareToken}`}
                  className="flex-1 bg-transparent text-xs text-zinc-200 px-2 outline-none font-mono"
                />
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-all cursor-pointer shrink-0"
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={handleModalClose}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateShare} className="flex flex-col gap-4 text-xs">
            {/* Permission Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-zinc-300">Link Permissions</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPermission("download")}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    permission === "download"
                      ? "bg-indigo-500/15 border-indigo-500 text-indigo-200 shadow-sm"
                      : "bg-[#0d101a] border-white/[0.06] text-zinc-400 hover:border-white/10"
                  }`}
                >
                  <span className="font-semibold text-white">Full Download</span>
                  <span className="text-[10px] text-zinc-400">Recipients can view & download</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPermission("view")}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    permission === "view"
                      ? "bg-indigo-500/15 border-indigo-500 text-indigo-200 shadow-sm"
                      : "bg-[#0d101a] border-white/[0.06] text-zinc-400 hover:border-white/10"
                  }`}
                >
                  <span className="font-semibold text-white">View Only</span>
                  <span className="text-[10px] text-zinc-400">Recipients cannot save locally</span>
                </button>
              </div>
            </div>

            {/* Optional Password Protection */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-zinc-300 flex items-center justify-between">
                <span>Passcode Protection</span>
                <span className="text-[10px] text-zinc-500 font-normal">Optional</span>
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave empty for open public link"
                  className="w-full bg-[#0d101a] border border-white/[0.08] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-zinc-100 placeholder-zinc-500 pl-8 pr-3 py-2 rounded-xl outline-none"
                />
              </div>
            </div>

            {/* Expiration Timer */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-zinc-300">Link Expiration</label>
              <select
                value={expiresInHours}
                onChange={(e) => setExpiresInHours(e.target.value)}
                className="w-full bg-[#0d101a] border border-white/[0.08] focus:border-indigo-500 text-zinc-200 px-3 py-2 rounded-xl outline-none cursor-pointer"
              >
                <option value="1">1 Hour</option>
                <option value="24">24 Hours (1 Day)</option>
                <option value="168">7 Days (Default)</option>
                <option value="720">30 Days (1 Month)</option>
                <option value="">Never Expires</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={handleModalClose}
                className="px-4 py-2 rounded-xl bg-white/[0.04] text-zinc-300 hover:text-white text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-500/25 transition-all cursor-pointer"
              >
                {loading ? "Generating..." : "Generate Share Link"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ShareModal;
