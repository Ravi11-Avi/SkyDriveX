import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  HardDrive,
  Image,
  Video,
  FileText,
  Music,
  Code,
  Star,
  Trash2,
  Share2,
  PieChart,
  Settings,
  Cloud,
  LogOut,
  FolderPlus,
  UploadCloud,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { storageApi } from "../../services/api";

export const Sidebar = ({ onOpenCreateFolder, onOpenUpload, mobileOpen, onCloseMobile }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [storageData, setStorageData] = useState(null);

  const fetchStorage = async () => {
    try {
      const res = await storageApi.getSummary();
      if (res.success && res.storage) {
        setStorageData(res.storage);
      }
    } catch (e) {
      // Quiet failure for storage gauge
    }
  };

  useEffect(() => {
    fetchStorage();
    const interval = setInterval(fetchStorage, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return "0 MB";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const navItems = [
    { to: "/", icon: HardDrive, label: "My Drive", end: true },
    { to: "/category/image", icon: Image, label: "Photos & Images" },
    { to: "/category/video", icon: Video, label: "Videos" },
    { to: "/category/document", icon: FileText, label: "Documents" },
    { to: "/category/audio", icon: Music, label: "Audio" },
    { to: "/category/code", icon: Code, label: "Code & Text" },
    { to: "/favorites", icon: Star, label: "Starred" },
    { to: "/shares", icon: Share2, label: "Shared Links" },
    { to: "/trash", icon: Trash2, label: "Trash" },
    { to: "/storage", icon: PieChart, label: "Storage & Audit" },
    { to: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <aside className={`sidebar-container ${mobileOpen ? "open" : ""}`}>
      {/* Brand Header */}
      <div className="sidebar-brand" onClick={() => navigate("/")}>
        <div className="brand-logo-glow">
          <Cloud className="brand-icon" size={26} />
        </div>
        <div className="brand-text">
          <span className="brand-name">SkyDrive<span className="brand-accent">X</span></span>
          <span className="brand-pill">Cloud Drive</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="sidebar-actions">
        <button
          className="btn btn-primary btn-action-main glow-effect"
          onClick={() => {
            onOpenUpload();
            if (onCloseMobile) onCloseMobile();
          }}
        >
          <UploadCloud size={18} />
          <span>Upload Files</span>
        </button>
        <button
          className="btn btn-secondary btn-action-sub"
          onClick={() => {
            onOpenCreateFolder();
            if (onCloseMobile) onCloseMobile();
          }}
          title="Create New Folder"
        >
          <FolderPlus size={18} />
          <span>New Folder</span>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
              onClick={onCloseMobile}
            >
              <Icon size={19} className="sidebar-link-icon" />
              <span className="sidebar-link-text">{item.label}</span>
              <ChevronRight size={14} className="sidebar-link-arrow" />
            </NavLink>
          );
        })}
      </nav>

      {/* Storage Quota Widget */}
      <div className="sidebar-storage-card glass-panel" onClick={() => navigate("/storage")}>
        <div className="storage-header">
          <PieChart size={16} className="storage-icon" />
          <span className="storage-label">Storage Usage</span>
        </div>
        <div className="storage-bar-bg">
          <div
            className="storage-bar-fill"
            style={{ width: `${Math.min(100, Math.max(2, storageData?.usedPercentage || 0))}%` }}
          />
        </div>
        <div className="storage-footer">
          <span>{formatBytes(storageData?.usedBytes || 0)}</span>
          <span className="storage-max">of {formatBytes(storageData?.maxQuota || 16106127360)}</span>
        </div>
      </div>

      {/* User Footer Profile */}
      <div className="sidebar-footer">
        <div className="user-profile-widget" onClick={() => navigate("/settings")}>
          <div className="user-avatar-circle">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="user-avatar-img" />
            ) : (
              <span>{user?.name ? user.name[0].toUpperCase() : "U"}</span>
            )}
          </div>
          <div className="user-info-text">
            <span className="user-display-name">{user?.name || "User"}</span>
            <span className="user-email-text">{user?.email || ""}</span>
          </div>
        </div>
        <button className="btn-logout-icon" onClick={logout} title="Sign Out">
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
