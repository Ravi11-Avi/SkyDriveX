import React, { useState, useEffect } from "react";
import {
  X,
  Download,
  Share2,
  FileText,
  FileCode,
  FileArchive,
  Calendar,
  HardDrive,
  ExternalLink,
  Tag,
  Maximize2,
} from "lucide-react";
import { fileApi } from "../../services/api";

export const FilePreviewModal = ({ isOpen, onClose, file, onShare }) => {
  const [viewUrl, setViewUrl] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [textContent, setTextContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!file || !isOpen) return;

    let isMounted = true;
    setLoading(true);
    setError("");
    setTextContent("");

    const loadUrls = async () => {
      try {
        // Fetch presigned / local view URL
        const viewRes = await fileApi.getViewUrl(file._id);
        if (isMounted && viewRes.viewUrl) {
          setViewUrl(viewRes.viewUrl);

          // If text or code, fetch raw content for preview
          if (file.category === "code" || file.category === "document" && file.extension === "txt" || file.extension === "md" || file.extension === "json") {
            try {
              const textRes = await fetch(viewRes.viewUrl);
              const text = await textRes.text();
              if (isMounted) setTextContent(text.slice(0, 50000)); // Limit to first 50KB for performance
            } catch (e) {}
          }
        }

        // Fetch download URL
        const dlRes = await fileApi.getDownloadUrl(file._id);
        if (isMounted && dlRes.downloadUrl) {
          setDownloadUrl(dlRes.downloadUrl);
        }
      } catch (err) {
        if (isMounted) setError("Could not generate secure preview URL");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadUrls();

    return () => {
      isMounted = false;
    };
  }, [file, isOpen]);

  if (!isOpen || !file) return null;

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const renderPreviewContent = () => {
    if (loading) {
      return (
        <div className="preview-loading-spinner">
          <div className="spinner-ring" />
          <span>Loading secure file preview...</span>
        </div>
      );
    }

    if (error) {
      return <div className="preview-error-box">{error}</div>;
    }

    switch (file.category) {
      case "image":
        return (
          <div className="preview-image-wrapper">
            <img src={viewUrl} alt={file.name} className="preview-image-element" />
          </div>
        );

      case "video":
        return (
          <div className="preview-media-wrapper">
            <video controls autoPlay={false} className="preview-video-element" src={viewUrl}>
              Your browser does not support the video tag.
            </video>
          </div>
        );

      case "audio":
        return (
          <div className="preview-audio-wrapper">
            <div className="audio-visual-disc">🎵</div>
            <h4>{file.name}</h4>
            <audio controls className="preview-audio-element" src={viewUrl}>
              Your browser does not support the audio element.
            </audio>
          </div>
        );

      case "pdf":
        return (
          <div className="preview-pdf-wrapper">
            <iframe src={viewUrl} title={file.name} className="preview-pdf-iframe" />
          </div>
        );

      case "code":
        return (
          <div className="preview-code-wrapper">
            <pre className="preview-code-block">
              <code>{textContent || "Loading code content..."}</code>
            </pre>
          </div>
        );

      default:
        return (
          <div className="preview-generic-fallback">
            <div className="generic-icon-circle">
              <FileText size={56} />
            </div>
            <h3>{file.name}</h3>
            <p>Direct browser preview is not available for this file format.</p>
            {downloadUrl && (
              <a href={downloadUrl} download={file.originalName} className="btn btn-primary" target="_blank" rel="noreferrer">
                <Download size={18} />
                <span>Download File ({formatFileSize(file.size)})</span>
              </a>
            )}
          </div>
        );
    }
  };

  return (
    <div className="modal-backdrop preview-modal-backdrop" onClick={onClose}>
      <div className="preview-modal-shell glass-panel" onClick={(e) => e.stopPropagation()}>
        {/* Top Header Bar */}
        <div className="preview-modal-header">
          <div className="preview-file-title-group">
            <h3>{file.name}</h3>
            <span className="badge badge-primary">{file.category}</span>
          </div>

          <div className="preview-header-actions">
            {downloadUrl && (
              <a
                href={downloadUrl}
                download={file.originalName}
                className="btn btn-secondary btn-sm"
                title="Download file"
                target="_blank"
                rel="noreferrer"
              >
                <Download size={16} />
                <span>Download</span>
              </a>
            )}

            {onShare && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  onClose();
                  onShare(file);
                }}
                title="Create Share Link"
              >
                <Share2 size={16} />
                <span>Share</span>
              </button>
            )}

            <button type="button" className="btn-icon" onClick={onClose} title="Close Preview">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Center Content Body */}
        <div className="preview-modal-body">{renderPreviewContent()}</div>

        {/* Bottom Details Footer */}
        <div className="preview-modal-footer">
          <div className="preview-meta-item">
            <HardDrive size={15} />
            <span>Size: {formatFileSize(file.size)}</span>
          </div>
          <div className="preview-meta-item">
            <Calendar size={15} />
            <span>Uploaded: {new Date(file.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="preview-meta-item">
            <Tag size={15} />
            <span>Type: {file.mimeType}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilePreviewModal;
