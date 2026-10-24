import React, { useState } from "react";
import { FolderPlus, X, Check } from "lucide-react";
import { folderApi } from "../../services/api";

const PRESET_COLORS = [
  "#4F46E5", // Indigo
  "#06B6D4", // Cyan
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#8B5CF6", // Purple
  "#EF4444", // Red
  "#3B82F6", // Blue
];

export const CreateFolderModal = ({ isOpen, onClose, currentFolderId, onFolderCreated }) => {
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a folder name");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await folderApi.create({
        name: name.trim(),
        parentFolder: currentFolderId || null,
        color: selectedColor,
      });

      if (res.success && res.folder) {
        onFolderCreated(res.folder);
        setName("");
        onClose();
      }
    } catch (err) {
      setError(err.message || "Failed to create folder");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-with-icon">
            <div className="modal-header-icon" style={{ backgroundColor: `${selectedColor}22`, color: selectedColor }}>
              <FolderPlus size={20} />
            </div>
            <h3>New Folder</h3>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert-error-box">{error}</div>}

            <div className="input-group">
              <label className="input-label">Folder Name</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Design Assets, Project Docs"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                maxLength={100}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Folder Color</label>
              <div className="color-palette-grid">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`color-swatch-btn ${selectedColor === color ? "active" : ""}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                  >
                    {selectedColor === color && <Check size={14} color="#ffffff" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Creating..." : "Create Folder"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateFolderModal;
