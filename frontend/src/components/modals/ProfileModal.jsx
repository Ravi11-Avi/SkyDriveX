import React, { useState } from "react";
import {
  X,
  User,
  Mail,
  ShieldCheck,
  Camera,
  Check,
  AlertCircle,
  Loader2,
  Calendar,
  Sparkles,
  Globe,
  KeyRound,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
];

export const ProfileModal = ({ isOpen, onClose }) => {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [customAvatarUrl, setCustomAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen || !user) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Name cannot be empty");
      return;
    }

    try {
      setSaving(true);
      setErrorMsg("");
      setSuccessMsg("");

      const finalAvatar = customAvatarUrl.trim() || avatar;
      await updateProfile({
        name: name.trim(),
        avatar: finalAvatar || null,
      });

      setSuccessMsg("Profile updated successfully!");
      setTimeout(() => {
        setSuccessMsg("");
        onClose();
      }, 700);
    } catch (err) {
      setErrorMsg(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSelectPreset = (url) => {
    setAvatar(url);
    setCustomAvatarUrl("");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="max-w-lg w-full bg-white dark:bg-[#0c101a] border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto scrollbar-thin">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 dark:text-indigo-400 flex items-center justify-center">
              <User size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">User Profile</h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">View and update your personal account details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <Check size={15} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Avatar Showcase */}
        <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-[#111726] border border-slate-200 dark:border-white/[0.06]">
          <div className="relative group shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg overflow-hidden ring-2 ring-indigo-500/30">
              {avatar || customAvatarUrl ? (
                <img
                  src={customAvatarUrl || avatar}
                  alt={name || user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{(name || user.name || "U")[0].toUpperCase()}</span>
              )}
            </div>
          </div>

          <div className="flex flex-col text-center sm:text-left min-w-0">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h4 className="text-base font-bold text-slate-900 dark:text-white truncate">{name || user.name}</h4>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold flex items-center gap-1">
                <ShieldCheck size={11} />
                Verified
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">{user.email}</p>
            <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-1.5 text-[11px] text-slate-400 dark:text-zinc-500">
              <Calendar size={12} />
              <span>Member since {new Date(user.createdAt || Date.now()).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSave} className="flex flex-col gap-4 text-xs">
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-slate-700 dark:text-zinc-300">Display Name</label>
            <div className="relative">
              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full bg-slate-50 dark:bg-[#0d101a] border border-slate-200 dark:border-white/[0.08] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 pl-9 pr-3 py-2 rounded-xl outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-slate-700 dark:text-zinc-300">Email Address (Account ID)</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full bg-slate-100 dark:bg-[#0d101a]/50 border border-slate-200 dark:border-white/[0.05] text-slate-500 dark:text-zinc-400 pl-9 pr-3 py-2 rounded-xl outline-none cursor-not-allowed"
              />
            </div>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500">
              Your primary email links all Google, GitHub, and password logins to this account.
            </span>
          </div>

          {/* Quick Avatar Presets */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-slate-700 dark:text-zinc-300 flex items-center justify-between">
              <span>Avatar Presets</span>
              <span className="text-[10px] text-indigo-500 dark:text-indigo-400">Click to preview</span>
            </label>
            <div className="grid grid-cols-6 gap-2">
              {AVATAR_PRESETS.map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleSelectPreset(preset)}
                  className={`w-11 h-11 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                    avatar === preset
                      ? "border-indigo-500 scale-105 shadow-md shadow-indigo-500/25"
                      : "border-slate-200 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/30"
                  }`}
                >
                  <img src={preset} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Custom Avatar URL */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-slate-700 dark:text-zinc-300">Or Custom Avatar Image URL</label>
            <div className="relative">
              <Camera size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
              <input
                type="url"
                value={customAvatarUrl}
                onChange={(e) => setCustomAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.png"
                className="w-full bg-slate-50 dark:bg-[#0d101a] border border-slate-200 dark:border-white/[0.08] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 pl-9 pr-3 py-2 rounded-xl outline-none"
              />
            </div>
          </div>

          {/* Connected Identities Pill */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#0d101a] border border-slate-200 dark:border-white/[0.06] flex flex-col gap-2">
            <span className="text-[11px] font-semibold text-slate-600 dark:text-zinc-400">Unified Account Link Status</span>
            <div className="grid grid-cols-3 gap-2 text-[10px]">
              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06]">
                <Globe size={13} className="text-amber-500" />
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-800 dark:text-zinc-200">Google</span>
                  <span className={user.googleId ? "text-emerald-500" : "text-slate-400 dark:text-zinc-500"}>
                    {user.googleId ? "Linked" : "Available"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06]">
                <svg className="w-3.5 h-3.5 fill-current text-indigo-500 shrink-0" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-800 dark:text-zinc-200">GitHub</span>
                  <span className={user.githubId ? "text-emerald-500" : "text-slate-400 dark:text-zinc-500"}>
                    {user.githubId ? "Linked" : "Available"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06]">
                <KeyRound size={13} className="text-violet-500" />
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-800 dark:text-zinc-200">Password</span>
                  <span className="text-emerald-500">Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-500/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              <span>{saving ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;
