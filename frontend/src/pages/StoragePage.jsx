import React, { useState, useEffect, useCallback } from "react";
import {
  HardDrive,
  Image,
  Video,
  Music,
  FileText,
  Code,
  Archive,
  Layers,
  Activity,
  Trash2,
  RefreshCw,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { storageApi, activityApi } from "../services/api";
import ConfirmModal from "../components/modals/ConfirmModal";

const CATEGORY_META = {
  image: { label: "Images", icon: Image, color: "text-sky-400", bg: "bg-sky-400/10", bar: "bg-sky-400" },
  video: { label: "Videos", icon: Video, color: "text-rose-400", bg: "bg-rose-400/10", bar: "bg-rose-400" },
  audio: { label: "Audio", icon: Music, color: "text-purple-400", bg: "bg-purple-400/10", bar: "bg-purple-400" },
  document: { label: "Documents", icon: FileText, color: "text-blue-400", bg: "bg-blue-400/10", bar: "bg-blue-400" },
  code: { label: "Code Files", icon: Code, color: "text-emerald-400", bg: "bg-emerald-400/10", bar: "bg-emerald-400" },
  archive: { label: "Archives", icon: Archive, color: "text-amber-400", bg: "bg-amber-400/10", bar: "bg-amber-400" },
  other: { label: "Others", icon: Layers, color: "text-zinc-400", bg: "bg-zinc-400/10", bar: "bg-zinc-400" },
};

export default function StoragePage() {
  const [summary, setSummary] = useState(null);
  const [activities, setActivities] = useState([]);
  const [activityTotal, setActivityTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);

  const showToast = (message, type = "success") => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const loadStorageData = useCallback(async () => {
    try {
      setLoading(true);
      const [storageRes, activityRes] = await Promise.all([
        storageApi.getSummary(),
        activityApi.getActivities({ page: 1, limit: 15 }),
      ]);

      if (storageRes.success) {
        setSummary(storageRes.summary);
      }
      if (activityRes.success) {
        setActivities(activityRes.activities || []);
        setActivityTotal(activityRes.total || 0);
      }
    } catch (err) {
      showToast(err.message || "Failed to load storage and activity data", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStorageData();
  }, [loadStorageData]);

  const handleClearActivities = () => {
    setConfirmModal({
      title: "Clear Activity Audit Log?",
      message:
        "This will permanently erase your recent activity audit logs from the system. Your files and folders will remain unaffected.",
      confirmLabel: "Clear Log",
      onConfirm: async () => {
        try {
          await activityApi.clear();
          setActivities([]);
          setActivityTotal(0);
          showToast("Activity history cleared");
        } catch (err) {
          showToast(err.message || "Failed to clear history", "error");
        } finally {
          setConfirmModal(null);
        }
      },
    });
  };

  const formatBytes = (bytes) => {
    if (!bytes && bytes !== 0) return "0 B";
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

  const used = summary?.usedStorage || 0;
  const limit = summary?.storageLimit || 5 * 1024 * 1024 * 1024;
  const percent = summary?.percentageUsed ? parseFloat(summary.percentageUsed) : ((used / limit) * 100);

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
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-white/[0.06]">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <HardDrive size={22} className="stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-['Outfit'] text-slate-900 dark:text-white">
              Storage & Audit Analytics
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Inspect your cloud storage allocation and real-time security activity events
            </p>
          </div>
        </div>

        <button
          onClick={loadStorageData}
          title="Refresh analytics"
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white border border-slate-200/80 dark:border-white/[0.08] transition-colors cursor-pointer"
        >
          <RefreshCw size={15} className={loading ? "animate-spin text-indigo-500" : ""} />
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400 dark:text-zinc-500">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-xs font-medium">Analyzing storage distribution...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Main Storage Allocation Hero Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0c0f17]/90 border border-slate-200/80 dark:border-white/[0.08] shadow-xs flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Total Allocated Quota
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-extrabold font-['Outfit'] text-slate-900 dark:text-white">
                    {formatBytes(used)}
                  </span>
                  <span className="text-sm font-medium text-slate-500 dark:text-zinc-500">
                    / {formatBytes(limit)} (Free Tier)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-300 self-start sm:self-auto">
                <span className="text-lg font-bold font-['Outfit']">{percent.toFixed(1)}%</span>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">used</span>
              </div>
            </div>

            {/* Segmented Multi-Color Progress Bar */}
            <div className="w-full bg-slate-200 dark:bg-zinc-800/80 h-3 rounded-full overflow-hidden flex gap-0.5 p-0.5">
              {summary?.categories &&
                Object.entries(summary.categories).map(([catKey, data]) => {
                  const catSize = data.size || 0;
                  const catPercent = (catSize / limit) * 100;
                  if (catPercent < 0.2) return null;
                  const meta = CATEGORY_META[catKey] || CATEGORY_META.other;
                  return (
                    <div
                      key={catKey}
                      className={`h-full ${meta.bar} rounded-full transition-all duration-500`}
                      style={{ width: `${catPercent}%` }}
                      title={`${meta.label}: ${formatBytes(catSize)} (${catPercent.toFixed(1)}%)`}
                    />
                  );
                })}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
              <ShieldCheck size={15} className="text-emerald-500 dark:text-emerald-400 shrink-0" />
              <span>Zero-knowledge client encrypted storage. Redundantly replicated in cloud buckets.</span>
            </div>
          </div>

          {/* Category Breakdown Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {summary?.categories &&
              Object.entries(summary.categories).map(([catKey, data]) => {
                const meta = CATEGORY_META[catKey] || CATEGORY_META.other;
                const IconComponent = meta.icon;
                const catSize = data.size || 0;
                const catCount = data.count || 0;
                const catPercent = used > 0 ? ((catSize / used) * 100).toFixed(1) : 0;

                return (
                  <div
                    key={catKey}
                    className="p-4 rounded-2xl bg-white dark:bg-[#0c0f17]/90 border border-slate-200/80 dark:border-white/[0.06] flex flex-col gap-3 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${meta.bg} ${meta.color} border border-slate-200 dark:border-white/5`}>
                        <IconComponent size={18} />
                      </div>
                      <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">{catPercent}%</span>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-slate-800 dark:text-zinc-200">{meta.label}</h4>
                      <p className="text-base font-bold font-['Outfit'] text-slate-900 dark:text-white mt-0.5">
                        {formatBytes(catSize)}
                      </p>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500">{catCount} files</span>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Security & Audit Activity Log */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0c0f17]/90 border border-slate-200/80 dark:border-white/[0.08] shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Activity size={18} className="text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Activity Audit Trail
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-white/[0.08]">
                  {activityTotal} events
                </span>
              </div>

              {activities.length > 0 && (
                <button
                  onClick={handleClearActivities}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-red-50 dark:bg-white/[0.04] dark:hover:bg-red-500/10 text-slate-600 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 border border-slate-200 dark:border-white/[0.06] hover:border-red-500/20 text-xs font-semibold transition-all cursor-pointer"
                >
                  <Trash2 size={13} />
                  <span>Clear History</span>
                </button>
              )}
            </div>

            {activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-500 text-xs gap-2">
                <Clock size={24} />
                <p>No activity events recorded yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-white/[0.06] text-slate-400 dark:text-zinc-500 uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3">Action</th>
                      <th className="py-2.5 px-3">Item / Description</th>
                      <th className="py-2.5 px-3">Timestamp</th>
                      <th className="py-2.5 px-3">Client IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                    {activities.map((act) => (
                      <tr key={act._id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="py-2.5 px-3">
                          <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                            {act.action.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-zinc-200">
                          {act.itemName || act.details?.name || "--"}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 dark:text-zinc-400">
                          {formatDate(act.createdAt)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-400 dark:text-zinc-500">
                          {act.ipAddress || "127.0.0.1"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
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
