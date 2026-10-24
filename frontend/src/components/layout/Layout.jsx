import React, { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { UploadCloud, CheckCircle2, AlertCircle, X } from "lucide-react";
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
      if (dragCounter === 0) {
        setIsDragging(false);
      }
    };

    const handleDragOver = (e) => {
      e.preventDefault();
    };

    const handleDrop = async (e) => {
      e.preventDefault();
      setIsDragging(false);
      dragCounter = 0;

      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const droppedFiles = Array.from(e.dataTransfer.files);
        if (droppedFiles.length > 10) {
          setUploadToast({ type: "error", text: "Max 10 files can be uploaded at once" });
          return;
        }

        setUploadToast({ type: "uploading", text: `Uploading ${droppedFiles.length} file(s)...` });

        try {
          const formData = new FormData();
          if (currentFolderId) formData.append("folder", currentFolderId);
          droppedFiles.forEach((file) => formData.append("files", file));

          const res = await fileApi.upload(formData);
          if (res.success) {
            setUploadToast({ type: "success", text: `${droppedFiles.length} file(s) uploaded successfully!` });
            triggerRefresh();
            setTimeout(() => setUploadToast(null), 4000);
          }
        } catch (err) {
          setUploadToast({ type: "error", text: err.message || "Upload failed" });
          setTimeout(() => setUploadToast(null), 5000);
        }
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
    <div className="app-layout-shell">
      {/* Global Drag & Drop Overlay */}
      {isDragging && (
        <div className="global-drag-overlay">
          <div className="drag-overlay-card glass-panel">
            <div className="drag-overlay-icon-ring">
              <UploadCloud size={52} />
            </div>
            <h2>Drop files anywhere to upload</h2>
            <p>Files will be added directly to your current SkyDriveX directory</p>
          </div>
        </div>
      )}

      {/* Floating Upload Notification Toast */}
      {uploadToast && (
        <div className={`floating-upload-toast glass-panel toast-${uploadToast.type}`}>
          <div className="toast-icon">
            {uploadToast.type === "uploading" && <div className="toast-spinner" />}
            {uploadToast.type === "success" && <CheckCircle2 size={18} color="#10B981" />}
            {uploadToast.type === "error" && <AlertCircle size={18} color="#EF4444" />}
          </div>
          <span className="toast-message">{uploadToast.text}</span>
          <button className="toast-close" onClick={() => setUploadToast(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Mobile Backdrop */}
      {mobileOpen && <div className="mobile-backdrop" onClick={() => setMobileOpen(false)} />}

      {/* Sidebar */}
      <Sidebar
        onOpenCreateFolder={() => setCreateFolderOpen(true)}
        onOpenUpload={() => setUploadOpen(true)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="app-main-viewport">
        <Navbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeToggle={toggleViewMode}
          onToggleMobile={() => setMobileOpen((prev) => !prev)}
          mobileOpen={mobileOpen}
        />

        <main className="app-page-content">
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

      {/* Global Modals */}
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
