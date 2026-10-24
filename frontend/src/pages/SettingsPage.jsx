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
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import ConfirmModal from "../components/modals/ConfirmModal";

export default function SettingsPage() {
  const { user, updateUser, changePassword, deleteAccount, theme, toggleTheme } = useAuth();

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
      await updateUser({ name, avatar });
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

  const isOAuthUser = !user?.authProvider || user?.authProvider !== "local";

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <User size={22} className="stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-['Outfit'] text-white">
              Account Settings
            </h1>
            <p className="text-xs text-zinc-400">
              Manage your personal credentials, identity, security, and workspace preferences
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="p-6 rounded-3xl bg-[#0c0f17]/90 border border-white/[0.08] shadow-xl flex flex-col gap-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <User size={17} className="text-indigo-400" />
              <span>Personal Identity</span>
            </div>
            <span className="text-[10px] uppercase font-semibold text-zinc-500 bg-white/[0.04] px-2 py-0.5 rounded border border-white/5">
              Public Profile
            </span>
          </div>

          {profileFeedback && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                profileFeedback.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                  : "bg-red-500/10 border-red-500/20 text-red-300"
              }`}
            >
              {profileFeedback.type === "success" ? <Check size={14} /> : <AlertTriangle size={14} />}
              <span>{profileFeedback.message}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4 text-xs">
            {/* Avatar Row */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white font-bold text-xl flex items-center justify-center shrink-0 overflow-hidden ring-2 ring-white/10 shadow-lg">
                {avatar ? (
                  <img src={avatar} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <span>{name?.charAt(0).toUpperCase() || "U"}</span>
                )}
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <label className="font-semibold text-zinc-300">Avatar Image URL</label>
                <div className="relative">
                  <Camera size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="url"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="https://example.com/avatar.png"
                    className="w-full bg-[#0d101a] border border-white/[0.08] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-zinc-100 placeholder-zinc-500 pl-8 pr-3 py-2 rounded-xl outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-zinc-300">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-[#0d101a] border border-white/[0.08] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-zinc-100 px-3 py-2 rounded-xl outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-zinc-300">Email Address</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full bg-white/[0.02] border border-white/[0.04] text-zinc-400 pl-8 pr-3 py-2 rounded-xl outline-none cursor-not-allowed"
                />
              </div>
              <span className="text-[10px] text-zinc-500">Email is locked to primary account</span>
            </div>

            <button
              type="submit"
              disabled={profileSaving}
              className="mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-medium text-xs shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
            >
              {profileSaving ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </div>

        {/* Security & Password Card */}
        <div className="p-6 rounded-3xl bg-[#0c0f17]/90 border border-white/[0.08] shadow-xl flex flex-col gap-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Shield size={17} className="text-indigo-400" />
              <span>Security & Passwords</span>
            </div>
            <span className="text-[10px] uppercase font-semibold text-zinc-500 bg-white/[0.04] px-2 py-0.5 rounded border border-white/5">
              Authentication
            </span>
          </div>

          {passwordFeedback && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                passwordFeedback.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                  : "bg-red-500/10 border-red-500/20 text-red-300"
              }`}
            >
              {passwordFeedback.type === "success" ? <Check size={14} /> : <AlertTriangle size={14} />}
              <span>{passwordFeedback.message}</span>
            </div>
          )}

          {isOAuthUser ? (
            <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-2">
                <Shield size={24} />
              </div>
              <h4 className="text-sm font-bold text-white">Single Sign-On Enabled</h4>
              <p className="text-xs text-zinc-400 max-w-xs">
                You are authenticated via <strong>{user?.authProvider || "OAuth"}</strong>. Passwords and credentials are managed directly through your identity provider.
              </p>
            </div>
          ) : (
            <form onSubmit={handleChangePassword} className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-zinc-300">Current Password</label>
                <div className="relative">
                  <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full bg-[#0d101a] border border-white/[0.08] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-zinc-100 pl-8 pr-3 py-2 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-zinc-300">New Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Min. 8 characters"
                    className="w-full bg-[#0d101a] border border-white/[0.08] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-zinc-100 pl-8 pr-3 py-2 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-zinc-300">Confirm New Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Repeat new password"
                    className="w-full bg-[#0d101a] border border-white/[0.08] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-zinc-100 pl-8 pr-3 py-2 rounded-xl outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={passwordSaving}
                className="mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-medium text-xs shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
              >
                {passwordSaving ? "Updating Password..." : "Update Password"}
              </button>
            </form>
          )}
        </div>

        {/* Theme Preferences */}
        <div className="p-6 rounded-3xl bg-[#0c0f17]/90 border border-white/[0.08] shadow-xl flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h4 className="text-sm font-bold text-white">Interface Theme</h4>
            <p className="text-xs text-zinc-400">
              Toggle between Midnight Obsidian and Crisp Lumina themes
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-zinc-200 transition-all cursor-pointer"
          >
            {theme === "dark" ? (
              <>
                <Sun size={15} className="text-amber-400" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon size={15} className="text-indigo-400" />
                <span>Dark Mode</span>
              </>
            )}
          </button>
        </div>

        {/* Danger Zone */}
        <div className="p-6 rounded-3xl bg-red-500/[0.03] border border-red-500/20 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h4 className="text-sm font-bold text-red-400">Danger Zone: Delete Account</h4>
            <p className="text-xs text-zinc-400">
              Permanently wipes all cloud files, folders, and shared links.
            </p>
          </div>
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 text-xs font-semibold transition-all cursor-pointer shrink-0"
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
