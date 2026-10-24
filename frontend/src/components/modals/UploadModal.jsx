import React, { useState, useRef } from "react";
import { UploadCloud, X, File, CheckCircle2, AlertCircle } from "lucide-react";
import { fileApi } from "../../services/api";

export const UploadModal = ({ isOpen, onClose, currentFolderId, onUploadComplete }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      if (filesArray.length > 10) {
        setError("You can upload a maximum of 10 files at once");
        return;
      }
      setSelectedFiles(filesArray);
      setError("");
    }
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError("Please select at least one file");
      return;
    }

    setUploading(true);
    setProgress(20);
    setError("");

    try {
      const formData = new FormData();
      if (currentFolderId) {
        formData.append("folder", currentFolderId);
      }

      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      setProgress(60);
      const res = await fileApi.upload(formData);
      setProgress(100);

      if (res.success && res.files) {
        onUploadComplete(res.files);
        setSelectedFiles([]);
        onClose();
      }
    } catch (err) {
      setError(err.message || "Failed to upload files");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-with-icon">
            <div className="modal-header-icon primary-accent">
              <UploadCloud size={20} />
            </div>
            <h3>Upload Files</h3>
          </div>
          <button className="btn-icon" onClick={onClose} disabled={uploading}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="alert-error-box">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Hidden native input */}
          <input
            type="file"
            ref={fileInputRef}
            multiple
            onChange={handleFileChange}
            style={{ display: "none" }}
          />

          {/* Dropzone click area */}
          <div
            className="modal-dropzone"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="dropzone-glow-icon">
              <UploadCloud size={38} />
            </div>
            <h4>Click to browse files</h4>
            <p>Support for images, videos, documents, audio, code & archives up to 100MB</p>
          </div>

          {/* Selected files list */}
          {selectedFiles.length > 0 && (
            <div className="selected-files-list">
              <div className="selected-files-title">
                <span>Selected ({selectedFiles.length}/10):</span>
                <span>
                  Total: {formatFileSize(selectedFiles.reduce((acc, f) => acc + f.size, 0))}
                </span>
              </div>
              {selectedFiles.map((f, idx) => (
                <div key={idx} className="file-chip-item">
                  <File size={16} className="file-chip-icon" />
                  <span className="file-chip-name">{f.name}</span>
                  <span className="file-chip-size">{formatFileSize(f.size)}</span>
                  {!uploading && (
                    <button
                      type="button"
                      className="file-chip-remove"
                      onClick={() => removeFile(idx)}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Progress bar */}
          {uploading && (
            <div className="upload-progress-box">
              <div className="upload-progress-label">
                <span>Uploading to SkyDriveX...</span>
                <span>{progress}%</span>
              </div>
              <div className="upload-progress-bar-bg">
                <div className="upload-progress-bar-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={uploading}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={uploading || selectedFiles.length === 0}
          >
            {uploading ? "Uploading..." : `Upload ${selectedFiles.length > 0 ? `(${selectedFiles.length})` : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;
