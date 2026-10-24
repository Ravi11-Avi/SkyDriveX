import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { UploadCloud, CheckCircle2, AlertCircle, X, Loader2 } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { CreateFolderModal } from "../modals/CreateFolderModal";
import { UploadModal } from "../modals/UploadModal";
import { ShareModal } from "../modals/ShareModal";
import { FilePreviewModal } from "../modals/FilePreviewModal";
import { MoveItemModal } from "../modals/MoveItemModal";
import { fileApi } from "../../services/api";

export const Layout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [viewMode, setViewMode] = useState(localStorage.getItem("skydrivex_view_mode") || "grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Modals state
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [shareData, setShareData] = useState(null); // { item, itemType }
  const [previewFile, setPreviewFile] = useState(null);
  const [moveData, setMoveData] = useState(null); // { item, itemType }

  // Drag and drop upload state
  const [isDragging, setIsDragging] = useState(false);
  const [uploadToast, setUploadToast] = useState(null); // { type: 'uploading'|'success'|'error', text: '' }

  const location = useLocation();

  // Reset search query on page navigation
  useEffect(() => {
    setSearchQuery("");
    setMobileOpen(false);
  }, [location.pathname]);

  const toggleViewMode = () => {
    const next = viewMode === "grid" ? "list" : "grid";
    setViewMode(next);
    localStorage.setItem("skydrivex_view_mode", next);
  };

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  // Window drag & drop listeners
  useEffect(() => {
    let dragCounter = 0;

    const handleDragEnter = (e) => {
      e.preventDefault();
      dragCounter++;
      if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter <= 0) {
        dragCounter = 0;
        setIsDragging(false);
      }
    };

    const handleDragOver = (e) => {
      e.preventDefault();
    };

    const handleDrop = async (e) => {
      e.preventDefault();
      dragCounter = 0;
      setIsDragging(false);

      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }
      if (currentFolderId) {
        formData.append("folder", currentFolderId);
      }

      try {
        setUploadToast({
          type: "uploading",
          text: `Uploading ${files.length} file${files.length > 1 ? "s" : ""} to SkyDriveX...`,
        });

        await fileApi.upload(formData);

        setUploadToast({
          type: "success",
          text: `Successfully uploaded ${files.length} file${files.length > 1 ? "s" : ""}!`,
        });
        triggerRefresh();

        setTimeout(() => setUploadToast(null), 4000);
      } catch (err) {
        setUploadToast({
          type: "error",
          text: err.message || "Failed to upload dropped files",
        });
        setTimeout(() => setUploadToast(null), 5000);
      }
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, [currentFolderId]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#06080d] text-slate-100 font-sans">
      {/* Global Drag & Drop Overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200 pointer-events-none">
          <div className="max-w-md w-full bg-[#0c101a] border-2 border-dashed border-indigo-500 rounded-3xl p-8 flex flex-col items-center text-center shadow-2xl shadow-indigo-500/20">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 animate-bounce">
              <UploadCloud size={32} />
            </div>
            <h2 className="text-xl font-bold font-['Outfit'] text-white mb-1">
              Drop files anywhere to upload
            </h2>
            <p className="text-xs text-zinc-400 max-w-xs">
              Files will be immediately uploaded to your current cloud directory
            </p>
          </div>
        </div>
      )}

      {/* Floating Upload Notification Toast */}
      {uploadToast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-xl text-sm font-medium animate-in slide-in-from-bottom-5 duration-200 ${
            uploadToast.type === "success"
              ? "bg-[#0c1a14]/90 border-emerald-500/30 text-emerald-300"
              : uploadToast.type === "error"
              ? "bg-[#1c0c0e]/90 border-red-500/30 text-red-300"
              : "bg-[#0c101a]/95 border-indigo-500/30 text-indigo-200"
          }`}
        >
          <div className="shrink-0">
            {uploadToast.type === "uploading" && (
              <Loader2 size={18} className="animate-spin text-indigo-400" />
            )}
            {uploadToast.type === "success" && (
              <CheckCircle2 size={18} className="text-emerald-400" />
            )}
            {uploadToast.type === "error" && (
              <AlertCircle size={18} className="text-red-400" />
            )}
          </div>
          <span>{uploadToast.text}</span>
          <button
            onClick={() => setUploadToast(null)}
            className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer ml-2"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden animate-in fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        onOpenCreateFolder={() => setCreateFolderOpen(true)}
        onOpenUpload={() => setUploadOpen(true)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden relative">
        <Navbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeToggle={toggleViewMode}
          onToggleMobile={() => setMobileOpen((prev) => !prev)}
          mobileOpen={mobileOpen}
        />

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 scrollbar-thin">
          <Outlet
            context={{
              viewMode,
              searchQuery,
              setCurrentFolderId,
              openPreview: (file) => setPreviewFile(file),
              openShare: (item, itemType) => setShareData({ item, itemType }),
              openMove: (item, itemType) => setMoveData({ item, itemType }),
              openUpload: () => setUploadOpen(true),
              openCreateFolder: () => setCreateFolderOpen(true),
              refreshTrigger,
              triggerRefresh,
            }}
          />
        </main>
      </div>

      {/* Modals */}
      <CreateFolderModal
        isOpen={createFolderOpen}
        onClose={() => setCreateFolderOpen(false)}
        currentFolderId={currentFolderId}
        onFolderCreated={triggerRefresh}
      />

      <UploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        currentFolderId={currentFolderId}
        onUploadComplete={triggerRefresh}
      />

      <ShareModal
        isOpen={Boolean(shareData)}
        onClose={() => setShareData(null)}
        item={shareData?.item}
        itemType={shareData?.itemType}
      />

      <FilePreviewModal
        isOpen={Boolean(previewFile)}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
        onShare={(f) => setShareData({ item: f, itemType: "file" })}
      />

      <MoveItemModal
        isOpen={Boolean(moveData)}
        onClose={() => setMoveData(null)}
        item={moveData?.item}
        itemType={moveData?.itemType}
        onMoved={triggerRefresh}
      />
    </div>
  );
};

export default Layout;
