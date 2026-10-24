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
  LogOut,
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
    <div className="dashboard-content">
      <div className="page-header">
        <div className="page-title-group">
          <div className="page-icon-badge purple">
            <User size={24} />
          </div>
          <div>
            <h1 className="page-title">Account Settings</h1>
            <p className="page-subtitle">
              Manage your personal profile, credentials, preferences, and account security
            </p>
          </div>
        </div>
      </div>

      <div className="settings-grid">
        {/* Profile Card */}
        <div className="glass-card settings-card">
          <div className="settings-card-header">
            <div className="flex-center gap-2">
              <User size={20} className="text-accent" />
              <h3>Personal Profile</h3>
            </div>
            <span className="badge badge-secondary">Public Identity</span>
          </div>

          {profileFeedback && (
            <div className={`feedback-alert ${profileFeedback.type}`}>
              {profileFeedback.type === "success" ? <Check size={16} /> : <AlertTriangle size={16} />}
              <span>{profileFeedback.message}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="settings-form">
            <div className="avatar-selection-row">
              <div className="avatar-large-preview">
                {avatar ? (
                  <img src={avatar} alt={name} className="avatar-img" />
                ) : (
                  <div className="avatar-placeholder">
                    {name?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
              </div>
              <div className="avatar-inputs flex-1">
                <label className="form-label">Avatar Image URL</label>
                <div className="input-group">
                  <Camera size={16} className="input-icon" />
                  <input
                    type="url"
                    className="form-input has-icon"
                    placeholder="https://example.com/avatar.png"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                  />
                </div>
                <span className="form-hint">Paste a link to any PNG or JPG image</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-group">
                <Mail size={16} className="input-icon" />
                <input
                  type="email"
                  className="form-input has-icon"
                  value={user?.email || ""}
                  disabled
                />
              </div>
              <span className="form-hint">Email is linked to your primary login account</span>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={profileSaving}
            >
              {profileSaving ? "Saving changes..." : "Save Profile"}
            </button>
          </form>
        </div>

        {/* Security & Password Card */}
        <div className="glass-card settings-card">
          <div className="settings-card-header">
            <div className="flex-center gap-2">
              <Shield size={20} className="text-accent" />
              <h3>Security & Password</h3>
            </div>
            <span className="badge badge-secondary">Authentication</span>
          </div>

          {passwordFeedback && (
            <div className={`feedback-alert ${passwordFeedback.type}`}>
              {passwordFeedback.type === "success" ? <Check size={16} /> : <AlertTriangle size={16} />}
              <span>{passwordFeedback.message}</span>
            </div>
          )}

          {isOAuthUser ? (
            <div className="oauth-account-notice">
              <div className="notice-icon">
                <Shield size={24} />
              </div>
              <h4>Single Sign-On Account</h4>
              <p>
                You are currently authenticated via your <strong>{user?.authProvider || "OAuth"}</strong> provider. Passwords are securely handled through your provider.
              </p>
            </div>
          ) : (
            <form onSubmit={handleChangePassword} className="settings-form">
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <div className="input-group">
                  <Key size={16} className="input-icon" />
                  <input
                    type="password"
                    className="form-input has-icon"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">New Password</label>
                <div className="input-group">
                  <Lock size={16} className="input-icon" />
                  <input
                    type="password"
                    className="form-input has-icon"
                    placeholder="Minimum 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <div className="input-group">
                  <Lock size={16} className="input-icon" />
                  <input
                    type="password"
                    className="form-input has-icon"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={passwordSaving}
              >
                {passwordSaving ? "Updating Password..." : "Update Password"}
              </button>
            </form>
          )}
        </div>

        {/* Preferences Card */}
        <div className="glass-card settings-card">
          <div className="settings-card-header">
            <div className="flex-center gap-2">
              <Sun size={20} className="text-warning" />
              <h3>Display & Theme</h3>
            </div>
          </div>

          <div className="theme-toggle-row">
            <div>
              <h4 className="font-medium">Interface Appearance</h4>
              <p className="text-secondary text-sm">
                Switch between Midnight Obsidian and Crisp Lumina themes
              </p>
            </div>
            <button
              className="btn btn-secondary theme-switch-btn"
              onClick={toggleTheme}
            >
              {theme === "dark" ? (
                <>
                  <Sun size={16} className="text-warning" /> Light Mode
                </>
              ) : (
                <>
                  <Moon size={16} className="text-cyan" /> Dark Mode
                </>
              )}
            </button>
          </div>
        </div>

        {/* Danger Zone Card */}
        <div className="glass-card settings-card danger-card">
          <div className="settings-card-header">
            <div className="flex-center gap-2">
              <AlertTriangle size={20} className="text-danger" />
              <h3 className="text-danger">Danger Zone</h3>
            </div>
          </div>

          <div className="danger-zone-content">
            <div>
              <h4 className="font-semibold">Delete Account Permanently</h4>
              <p className="text-secondary text-sm">
                Once deleted, all of your files, folders, shared links, and activity logs will be permanently erased.
              </p>
            </div>
            <button
              className="btn btn-danger"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 size={16} />
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <ConfirmModal
          isOpen={true}
          title="Permanently Delete Account?"
          message="This action is irreversible. All of your uploaded files, custom folders, shared links, and user data will be destroyed immediately. Are you sure you wish to proceed?"
          confirmLabel="Permanently Delete"
          isDestructive={true}
          onConfirm={handleDeleteAccount}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}
