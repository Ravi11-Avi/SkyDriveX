import React, { useState } from "react";
import {
  User,
  Shield,
  Key,
  Sun,
  Moon,
  Trash2,
  Check,
  AlertTriangle,
  Lock,
  Mail,
  Camera,
  Globe,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import ConfirmModal from "../components/modals/ConfirmModal";

export default function SettingsPage() {
  const { user, updateProfile, changePassword, deleteAccount, theme, toggleTheme } = useAuth();

  // Profile Form state
  const [name, setName] = useState(user?.name || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState(null);

  // Password Form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState(null);

  // Danger Zone state
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setProfileSaving(true);
      setProfileFeedback(null);
      await updateProfile({ name: name.trim(), avatar: avatar.trim() || null });
      setProfileFeedback({ type: "success", message: "Profile updated successfully!" });
    } catch (err) {
      setProfileFeedback({ type: "error", message: err.message || "Failed to update profile" });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: "error", message: "New passwords do not match" });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordFeedback({ type: "error", message: "Password must be at least 8 characters long" });
      return;
    }

    try {
      setPasswordSaving(true);
      setPasswordFeedback(null);
      await changePassword(currentPassword, newPassword);
      setPasswordFeedback({ type: "success", message: "Password updated successfully!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordFeedback({ type: "error", message: err.message || "Failed to change password" });
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
    } catch (err) {
      alert(err.message || "Failed to delete account");
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-white/[0.06]">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <User size={22} className="stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-['Outfit'] text-slate-900 dark:text-white">
              Account Settings
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Manage your personal credentials, identity, security, and workspace preferences
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0c0f17]/90 border border-slate-200/80 dark:border-white/[0.08] shadow-xs flex flex-col gap-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/[0.06]">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <User size={17} className="text-indigo-600 dark:text-indigo-400" />
              <span>Personal Identity</span>
            </div>
            <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-zinc-500 bg-slate-100 dark:bg-white/[0.04] px-2 py-0.5 rounded border border-slate-200 dark:border-white/5">
              Public Profile
            </span>
          </div>

          {profileFeedback && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                profileFeedback.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                  : "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-300"
              }`}
            >
              {profileFeedback.type === "success" ? <Check size={14} /> : <AlertTriangle size={14} />}
              <span>{profileFeedback.message}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4 text-xs">
            {/* Avatar Row */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white font-bold text-xl flex items-center justify-center shrink-0 overflow-hidden ring-2 ring-indigo-500/20 shadow-md">
                {avatar ? (
                  <img src={avatar} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <span>{name?.charAt(0).toUpperCase() || "U"}</span>
                )}
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <label className="font-semibold text-slate-700 dark:text-zinc-300">Avatar Image URL</label>
                <div className="relative">
                  <Camera size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                  <input
                    type="url"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="https://example.com/avatar.png"
                    className="w-full bg-slate-50 dark:bg-[#0d101a] border border-slate-200 dark:border-white/[0.08] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 pl-8 pr-3 py-2 rounded-xl outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700 dark:text-zinc-300">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-slate-50 dark:bg-[#0d101a] border border-slate-200 dark:border-white/[0.08] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-zinc-100 px-3 py-2 rounded-xl outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700 dark:text-zinc-300">Email Address</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.04] text-slate-500 dark:text-zinc-400 pl-8 pr-3 py-2 rounded-xl outline-none cursor-not-allowed"
                />
              </div>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500">Email is linked to all login methods</span>
            </div>

            <button
              type="submit"
              disabled={profileSaving}
              className="mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
            >
              {profileSaving ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </div>

        {/* Security & Password Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0c0f17]/90 border border-slate-200/80 dark:border-white/[0.08] shadow-xs flex flex-col gap-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/[0.06]">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Shield size={17} className="text-indigo-600 dark:text-indigo-400" />
              <span>Security & Passwords</span>
            </div>
            <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-zinc-500 bg-slate-100 dark:bg-white/[0.04] px-2 py-0.5 rounded border border-slate-200 dark:border-white/5">
              Authentication
            </span>
          </div>

          {passwordFeedback && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                passwordFeedback.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                  : "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-300"
              }`}
            >
              {passwordFeedback.type === "success" ? <Check size={14} /> : <AlertTriangle size={14} />}
              <span>{passwordFeedback.message}</span>
            </div>
          )}

          {/* Social Identity Links */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#111726] border border-slate-200/80 dark:border-white/[0.06] flex flex-col gap-2">
            <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">Unified Account Linking</span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05]">
                <Globe size={14} className="text-amber-500" />
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-800 dark:text-zinc-200">Google OAuth</span>
                  <span className={user?.googleId ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-slate-400 dark:text-zinc-500"}>
                    {user?.googleId ? "Connected" : "Not connected"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05]">
                <svg className="w-4 h-4 fill-current text-indigo-600 dark:text-indigo-400 shrink-0" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-800 dark:text-zinc-200">GitHub OAuth</span>
                  <span className={user?.githubId ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-slate-400 dark:text-zinc-500"}>
                    {user?.githubId ? "Connected" : "Not connected"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="flex flex-col gap-4 text-xs">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700 dark:text-zinc-300">Current Password</label>
              <div className="relative">
                <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full bg-slate-50 dark:bg-[#0d101a] border border-slate-200 dark:border-white/[0.08] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-zinc-100 pl-8 pr-3 py-2 rounded-xl outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700 dark:text-zinc-300">New Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Min. 8 characters"
                  className="w-full bg-slate-50 dark:bg-[#0d101a] border border-slate-200 dark:border-white/[0.08] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-zinc-100 pl-8 pr-3 py-2 rounded-xl outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700 dark:text-zinc-300">Confirm New Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Repeat new password"
                  className="w-full bg-slate-50 dark:bg-[#0d101a] border border-slate-200 dark:border-white/[0.08] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-zinc-100 pl-8 pr-3 py-2 rounded-xl outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={passwordSaving}
              className="mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
            >
              {passwordSaving ? "Updating Password..." : "Update Password"}
            </button>
          </form>
        </div>

        {/* Theme Preferences */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0c0f17]/90 border border-slate-200/80 dark:border-white/[0.08] shadow-xs flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Interface Theme</h4>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Toggle between Day Mode (Crisp Lumina) and Dark Mode (Midnight Obsidian)
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold text-slate-800 dark:text-zinc-200 transition-all cursor-pointer"
          >
            {theme === "dark" ? (
              <>
                <Sun size={15} className="text-amber-400" />
                <span>Day Mode (Light)</span>
              </>
            ) : (
              <>
                <Moon size={15} className="text-indigo-600" />
                <span>Dark Mode</span>
              </>
            )}
          </button>
        </div>

        {/* Danger Zone */}
        <div className="p-6 rounded-3xl bg-red-500/[0.03] border border-red-500/20 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h4 className="text-sm font-bold text-red-600 dark:text-red-400">Danger Zone: Delete Account</h4>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Permanently wipes all cloud files, folders, and shared links.
            </p>
          </div>
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 text-xs font-semibold transition-all cursor-pointer shrink-0"
          >
            <Trash2 size={14} />
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <ConfirmModal
          isOpen={true}
          title="Permanently Delete Account?"
          message="This action is irreversible. All of your uploaded files, custom folders, shared links, and user data will be destroyed immediately. Are you sure you wish to proceed?"
          confirmText="Permanently Delete"
          onConfirm={handleDeleteAccount}
          onClose={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}
