import React from "react";

interface CustomModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function CustomModal({
  open,
  onClose,
  children,
}: CustomModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-7xl mx-4">
        <button
          className="absolute top-4 right-4 text-2xl text-gray-400 hover:text-gray-600"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
}
