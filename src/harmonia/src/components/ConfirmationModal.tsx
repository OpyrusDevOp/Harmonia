import { useState } from "react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: Function;
  title: string;
}

// Input Modal Component
const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onSubmit, title }) => {

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-96">
        <h3 className="text-lg font-bold mb-4">{title}</h3>
        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-500"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700"
            onClick={() => {
              onSubmit();
              onClose();
            }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
