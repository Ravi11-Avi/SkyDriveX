import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import {
  Folder,
  ChevronRight,
  HardDrive,
  UploadCloud,
  FolderPlus,
  Download,
  Search,
  Sparkles,
  Inbox,
} from "lucide-react";
import { folderApi, fileApi } from "../services/api";
import { FolderCard } from "../components/drive/FolderCard";
import { FileCard } from "../components/drive/FileCard";
import { FileListRow } from "../components/drive/FileListRow";
import { ConfirmModal } from "../components/modals/ConfirmModal";

export const DashboardPage = () => {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const {
    viewMode,
    searchQuery,
    setCurrentFolderId,
    openPreview,
    openShare,
    openMove,
    openUpload,
    openCreateFolder,
    refreshTrigger,
    triggerRefresh,
  } = useOutletContext();

  const [currentFolder, setCurrentFolder] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Delete target state for confirmation modal
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Sync currentFolderId with parent Layout for global drag & drop uploads
  useEffect(() => {
    setCurrentFolderId(folderId || null);
  }, [folderId, setCurrentFolderId]);

  // Load folder contents
  useEffect(() => {
    const fetchContents = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await folderApi.getContents(folderId || null);

        if (res.success) {
          setCurrentFolder(res.currentFolder || null);
          setBreadcrumbs(res.breadcrumbs || []);
          setFolders(res.folders || []);
          setFiles(res.files || []);
        }
      } catch (err) {
        setError(err.message || "Failed to load drive items");
      } finally {
        setLoading(false);
      }
    };

    fetchContents();
  }, [folderId, refreshTrigger]);

  // Handle Favorites toggle
  const handleToggleFavoriteFolder = async (folder) => {
    try {
      await folderApi.update(folder._id, { isFavorite: !folder.isFavorite });
      setFolders((prev) =>
        prev.map((f) => (f._id === folder._id ? { ...f, isFavorite: !f.isFavorite } : f))
      );
    } catch (err) {
      alert(err.message || "Failed to update favorite");
    }
  };

  const handleToggleFavoriteFile = async (file) => {
    try {
      await fileApi.update(file._id, { isFavorite: !file.isFavorite });
      setFiles((prev) =>
        prev.map((f) => (f._id === file._id ? { ...f, isFavorite: !f.isFavorite } : f))
      );
    } catch (err) {
      alert(err.message || "Failed to update favorite");
    }
  };

  // Trashing items
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "folder") {
        await folderApi.trash(deleteTarget.item._id);
        setFolders((prev) => prev.filter((f) => f._id !== deleteTarget.item._id));
      } else {
        await fileApi.trash(deleteTarget.item._id);
        setFiles((prev) => prev.filter((f) => f._id !== deleteTarget.item._id));
      }
      setDeleteTarget(null);
      triggerRefresh();
    } catch (err) {
      alert(err.message || "Failed to move item to trash");
    }
  };

  // Filtering search query
  const query = (searchQuery || "").trim().toLowerCase();
  const filteredFolders = folders.filter((f) => f.name.toLowerCase().includes(query));
  const filteredFiles = files.filter(
    (f) =>
      f.name.toLowerCase().includes(query) ||
      (f.category && f.category.toLowerCase().includes(query))
  );

  const isFolderEmpty = filteredFolders.length === 0 && filteredFiles.length === 0;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Breadcrumb Navigation & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-white/[0.06]">
        {/* Breadcrumb Trail */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none text-sm">
          <button
            onClick={() => navigate("/")}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl font-medium transition-colors cursor-pointer ${
              !folderId
                ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/[0.04]"
            }`}
          >
            <HardDrive size={15} />
            <span>My Drive</span>
          </button>

          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb._id}>
                <ChevronRight size={13} className="text-slate-400 dark:text-zinc-600 shrink-0" />
                <button
                  onClick={() => !isLast && navigate(`/folder/${crumb._id}`)}
                  className={`px-2.5 py-1.5 rounded-xl font-medium truncate max-w-[160px] transition-colors cursor-pointer ${
                    isLast
                      ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20"
                      : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/[0.04]"
                  }`}
                  title={crumb.name}
                >
                  {crumb.name}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {folderId && (
            <a
              href={folderApi.getZipDownloadUrl(folderId)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-white/[0.08] text-xs font-semibold transition-all"
              title="Download entire directory as ZIP"
            >
              <Download size={14} className="text-indigo-600 dark:text-indigo-400" />
              <span>Download ZIP</span>
            </a>
          )}

          <button
            onClick={openCreateFolder}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-white/[0.08] text-xs font-semibold transition-all cursor-pointer"
          >
            <FolderPlus size={14} />
            <span>New Folder</span>
          </button>

          <button
            onClick={openUpload}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <UploadCloud size={14} />
            <span>Upload</span>
          </button>
        </div>
      </div>

      {/* Main Content Explorer */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-500">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-xs font-medium">Loading workspace files...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
          {error}
        </div>
      ) : isFolderEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 dark:text-indigo-400 mb-4">
            <Inbox size={32} className="stroke-[1.6]" />
          </div>
          <h3 className="text-lg font-bold font-['Outfit'] text-slate-900 dark:text-white mb-1">
            {searchQuery ? "No matching items found" : "This folder is empty"}
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mb-6">
            {searchQuery
              ? `No files or folders matched "${searchQuery}". Try a different keyword.`
              : "Drag and drop any files here or click Upload to start adding content to your cloud drive."}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={openUpload}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
            >
              <UploadCloud size={15} />
              <span>Upload Files</span>
            </button>
            <button
              onClick={openCreateFolder}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-slate-700 dark:text-zinc-300 border border-slate-200/80 dark:border-white/[0.08] text-xs font-semibold transition-all cursor-pointer"
            >
              <FolderPlus size={15} />
              <span>New Folder</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Subfolders Section */}
          {filteredFolders.length > 0 && (
            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-400">
                  Folders ({filteredFolders.length})
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredFolders.map((f) => (
                  <FolderCard
                    key={f._id}
                    folder={f}
                    onClick={() => navigate(`/folder/${f._id}`)}
                    onShare={(folder) => openShare(folder, "folder")}
                    onMove={(folder) => openMove(folder, "folder")}
                    onRename={() => {}}
                    onDelete={(folder) => setDeleteTarget({ type: "folder", item: folder })}
                    onDownloadZip={() => {
                      window.open(folderApi.getZipDownloadUrl(f._id), "_blank");
                    }}
                    onToggleFavorite={handleToggleFavoriteFolder}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Files Section */}
          {filteredFiles.length > 0 && (
            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-400">
                  Files ({filteredFiles.length})
                </span>
              </div>

              {viewMode === "grid" ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                  {filteredFiles.map((file) => (
                    <FileCard
                      key={file._id}
                      file={file}
                      onPreview={openPreview}
                      onShare={(f) => openShare(f, "file")}
                      onMove={(f) => openMove(f, "file")}
                      onRename={() => {}}
                      onDelete={(f) => setDeleteTarget({ type: "file", item: f })}
                      onToggleFavorite={handleToggleFavoriteFile}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    <span className="flex-1 mr-4">Name</span>
                    <span className="hidden sm:block w-28">Category</span>
                    <span className="hidden md:block w-24">Size</span>
                    <span className="hidden lg:block w-32">Modified</span>
                    <span className="w-16 text-right">Actions</span>
                  </div>
                  {filteredFiles.map((file) => (
                    <FileListRow
                      key={file._id}
                      file={file}
                      onPreview={openPreview}
                      onShare={(f) => openShare(f, "file")}
                      onMove={(f) => openMove(f, "file")}
                      onRename={() => {}}
                      onDelete={(f) => setDeleteTarget({ type: "file", item: f })}
                      onToggleFavorite={handleToggleFavoriteFile}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Move to Trash?"
        message={`Are you sure you want to move "${deleteTarget?.item?.name}" to Trash? Items remain in Trash for 30 days.`}
        confirmText="Move to Trash"
      />
    </div>
  );
};

export default DashboardPage;
