import React from "react";
import { AlertTriangle, X } from "lucide-react";

export const ConfirmModal = ({
  isOpen,
  onClose,
  onCancel,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  confirmLabel,
  isDestructive = true,
  loading = false,
}) => {
  if (!isOpen) return null;

  const handleClose = () => {
    if (onClose) onClose();
    else if (onCancel) onCancel();
  };

  const buttonText = confirmText || confirmLabel || "Confirm";

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="max-w-md w-full bg-[#0c101a] border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isDestructive
                ? "bg-red-500/10 border border-red-500/20 text-red-400"
                : "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400"
            }`}
          >
            <AlertTriangle size={20} />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <h3 className="text-base font-bold text-white">{title}</h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.06]">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-white/[0.04] text-zinc-300 hover:text-white text-xs font-medium cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer ${
              isDestructive
                ? "bg-red-600 hover:bg-red-500 text-white shadow-red-500/25"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/25"
            }`}
          >
            {loading ? "Processing..." : buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
