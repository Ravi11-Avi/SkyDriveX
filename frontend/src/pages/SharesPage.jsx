import React, { useState, useEffect, useCallback } from "react";
import {
  Share2,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  Lock,
  Unlock,
  Eye,
  Download,
  Calendar,
  Folder,
  FileText,
  RefreshCw,
  Power,
} from "lucide-react";
import { shareApi } from "../services/api";
import ConfirmModal from "../components/modals/ConfirmModal";

export default function SharesPage() {
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  const showToast = (message, type = "success") => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const loadShares = useCallback(async () => {
    try {
      setLoading(true);
      const res = await shareApi.getMyShares();
      if (res.success) {
        setShares(res.shares || []);
      }
    } catch (err) {
      showToast(err.message || "Failed to load shares", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShares();
  }, [loadShares]);

  const handleCopyLink = (share) => {
    const url = `${window.location.origin}/share/${share.token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(share._id);
    showToast("Share link copied to clipboard");
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleToggleActive = async (share) => {
    try {
      setProcessingId(share._id);
      const res = await shareApi.update(share._id, { isActive: !share.isActive });
      if (res.success) {
        setShares((prev) =>
          prev.map((s) => (s._id === share._id ? { ...s, isActive: !s.isActive } : s))
        );
        showToast(`Share link ${!share.isActive ? "activated" : "deactivated"}`);
      }
    } catch (err) {
      showToast(err.message || "Failed to update link status", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRevokeShare = (share) => {
    setConfirmModal({
      title: "Revoke Share Link?",
      message:
        "Anyone with this link will immediately lose access to the shared content. This link will be permanently destroyed.",
      confirmLabel: "Revoke Link",
      isDestructive: true,
      onConfirm: async () => {
        try {
          setProcessingId(share._id);
          await shareApi.revoke(share._id);
          setShares((prev) => prev.filter((s) => s._id !== share._id));
          showToast("Share link revoked permanently");
        } catch (err) {
          showToast(err.message || "Failed to revoke share", "error");
        } finally {
          setProcessingId(null);
          setConfirmModal(null);
        }
      },
    });
  };

  const isExpired = (expiresAt) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

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
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">
            <Share2 size={22} className="stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-['Outfit'] text-white">
              Shared Links Manager
            </h1>
            <p className="text-xs text-zinc-400">
              Manage public and password-protected transfer links ({shares.length} created)
            </p>
          </div>
        </div>

        <button
          onClick={loadShares}
          title="Refresh links"
          className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white border border-white/[0.08] transition-colors cursor-pointer"
        >
          <RefreshCw size={15} className={loading ? "animate-spin text-indigo-400" : ""} />
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-500">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-xs font-medium">Loading share links...</p>
        </div>
      ) : shares.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400 mb-4">
            <Share2 size={32} className="stroke-[1.6]" />
          </div>
          <h3 className="text-lg font-bold font-['Outfit'] text-white mb-1">
            No shared links active
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mb-6">
            Generate shareable links from any file or folder card to send files securely with password protection or expiration timers.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-[#0c0f17]/90 border border-white/[0.07] shadow-xl">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] text-zinc-500 uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Shared Item</th>
                <th className="py-3.5 px-4">Security</th>
                <th className="py-3.5 px-4">Permission</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Expires</th>
                <th className="py-3.5 px-4">Traffic</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {shares.map((share) => {
                const expired = isExpired(share.expiresAt);
                const itemName = share.item?.name || "Shared Item";
                const isFolder = share.itemType === "folder";

                return (
                  <tr key={share._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isFolder ? "bg-indigo-500/10 text-indigo-400" : "bg-sky-500/10 text-sky-400"
                          }`}
                        >
                          {isFolder ? <Folder size={16} /> : <FileText size={16} />}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-zinc-100 truncate max-w-[200px]">
                            {itemName}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            /share/{share.token.slice(0, 10)}...
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {share.isPasswordProtected ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-400/10 text-amber-400 border border-amber-400/20">
                          <Lock size={10} /> Password
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                          <Unlock size={10} /> Public
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {share.permission === "download" ? "Download" : "View Only"}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {expired ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                          Expired
                        </span>
                      ) : share.isActive ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Active
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                          Disabled
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-zinc-400">
                      <div className="flex items-center gap-1 text-[11px]">
                        <Calendar size={12} className="text-zinc-500" />
                        {formatDate(share.expiresAt)}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400">
                          <Eye size={12} className="text-zinc-500" /> {share.views || 0}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400">
                          <Download size={12} className="text-zinc-500" /> {share.downloads || 0}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleCopyLink(share)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
                          title="Copy Link"
                        >
                          {copiedId === share._id ? (
                            <Check size={14} className="text-emerald-400" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>

                        <a
                          href={`/share/${share.token}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                          title="Open guest page"
                        >
                          <ExternalLink size={14} />
                        </a>

                        <button
                          onClick={() => handleToggleActive(share)}
                          disabled={processingId === share._id}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            share.isActive
                              ? "text-emerald-400 hover:bg-emerald-400/10"
                              : "text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.08]"
                          }`}
                          title={share.isActive ? "Disable Link" : "Enable Link"}
                        >
                          <Power size={14} />
                        </button>

                        <button
                          onClick={() => handleRevokeShare(share)}
                          disabled={processingId === share._id}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="Revoke Share Link"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
