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
  Database,
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
      if (res.success && res.summary) {
        setStorageData(res.summary);
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
    if (!bytes && bytes !== 0) return "0 MB";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const navItems = [
    { to: "/", icon: HardDrive, label: "My Drive", end: true },
    { to: "/category/image", icon: Image, label: "Photos & Media" },
    { to: "/category/video", icon: Video, label: "Videos" },
    { to: "/category/document", icon: FileText, label: "Documents" },
    { to: "/category/audio", icon: Music, label: "Audio" },
    { to: "/category/code", icon: Code, label: "Code & Text" },
    { to: "/favorites", icon: Star, label: "Favorites" },
    { to: "/shares", icon: Share2, label: "Shared Links" },
    { to: "/trash", icon: Trash2, label: "Trash" },
    { to: "/storage", icon: PieChart, label: "Storage & Audit" },
    { to: "/settings", icon: Settings, label: "Settings" },
  ];

  const used = storageData?.usedStorage || 0;
  const limit = storageData?.storageLimit || 5 * 1024 * 1024 * 1024;
  const percent = storageData?.percentageUsed ? parseFloat(storageData.percentageUsed) : ((used / limit) * 100);

  return (
    <aside
      className={`fixed lg:static top-0 left-0 z-40 w-64 h-screen bg-[#07090e] border-r border-white/[0.06] flex flex-col justify-between transition-transform duration-300 ease-in-out ${
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}
    >
      {/* Top Section */}
      <div className="flex flex-col flex-1 min-h-0 overflow-y-auto px-4 py-5 scrollbar-thin">
        {/* Brand Logo */}
        <div
          onClick={() => {
            navigate("/");
            if (onCloseMobile) onCloseMobile();
          }}
          className="flex items-center gap-3 px-2 py-2 mb-6 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-all duration-200">
            <Cloud size={22} className="stroke-[2.2]" />
          </div>
          <div className="flex flex-col">
            <span className="font-['Outfit'] font-bold text-lg tracking-tight text-white flex items-center gap-0.5">
              SkyDrive<span className="text-indigo-400">X</span>
            </span>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-indigo-400/80 -mt-0.5">
              Cloud Workspace
            </span>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-col gap-2 mb-6">
          <button
            onClick={() => {
              onOpenUpload();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-medium text-sm shadow-md shadow-indigo-500/25 active:scale-[0.98] transition-all duration-200 cursor-pointer"
          >
            <UploadCloud size={17} className="stroke-[2.2]" />
            <span>Upload Files</span>
          </button>
          <button
            onClick={() => {
              onOpenCreateFolder();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/[0.07] text-sm font-medium transition-all duration-150 cursor-pointer"
          >
            <FolderPlus size={16} />
            <span>New Folder</span>
          </button>
        </div>

        {/* Navigation Section */}
        <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-2 mb-2">
          Workspace
        </div>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 shadow-sm"
                      : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]"
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon size={17} className="stroke-[1.8]" />
                  <span>{item.label}</span>
                </div>
                <ChevronRight size={13} className="text-zinc-600 opacity-60" />
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Storage & User Profile */}
      <div className="p-4 border-t border-white/[0.06] bg-[#07090e]/80 flex flex-col gap-3">
        {/* Storage Bar Card */}
        <div
          onClick={() => {
            navigate("/storage");
            if (onCloseMobile) onCloseMobile();
          }}
          className="bg-[#0e121c]/90 border border-white/[0.07] hover:border-indigo-500/30 rounded-xl p-3 cursor-pointer transition-all duration-200"
        >
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span className="flex items-center gap-1.5 font-medium">
              <Database size={13} className="text-indigo-400" />
              Cloud Storage
            </span>
            <span className="font-semibold text-zinc-200">{percent.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-zinc-800/80 h-1.5 rounded-full overflow-hidden mb-2">
            <div
              className="bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(3, percent))}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-zinc-500">
            <span>{formatBytes(used)} used</span>
            <span>{formatBytes(limit)}</span>
          </div>
        </div>

        {/* User Profile Mini Bar */}
        <div className="flex items-center justify-between px-2 py-1.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          <div
            onClick={() => {
              navigate("/settings");
              if (onCloseMobile) onCloseMobile();
            }}
            className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 text-white font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden ring-1 ring-white/20">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span>{user?.name ? user.name[0].toUpperCase() : "U"}</span>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-zinc-200 truncate leading-tight">
                {user?.name || "User"}
              </span>
              <span className="text-[10px] text-zinc-500 truncate leading-tight">
                {user?.email || ""}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
