
import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  isLoading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmLabel = 'Confirm', 
  isLoading = false 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-sm" 
        onClick={isLoading ? undefined : onClose}
      />
      
      <div className="relative w-full max-w-sm bg-black border border-red-900/50 shadow-2xl stitch-corner p-8 animate-in zoom-in-95 duration-200">
        <h3 className="text-xl font-black uppercase tracking-tighter italic text-white mb-4">{title}</h3>
        <p className="text-[10px] text-zinc-400 uppercase tracking-widest leading-loose mb-8">
          {message}
        </p>
        
        <div className="flex gap-4">
          <button 
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 border border-zinc-800 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:bg-zinc-900 hover:text-white transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 bg-red-600 text-white py-3 text-[9px] font-black uppercase tracking-widest hover:bg-red-700 transition-all disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
