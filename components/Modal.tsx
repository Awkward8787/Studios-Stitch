
import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Content */}
      <div className="relative w-full max-w-lg bg-black border border-zinc-800 shadow-2xl stitch-corner p-8 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-8 border-b border-zinc-900 pb-4">
          <h3 className="text-xl font-black uppercase tracking-tighter italic text-white">{title}</h3>
          <button 
            onClick={onClose} 
            className="text-zinc-500 hover:text-fuchsia-studio transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        
        {children}
      </div>
    </div>
  );
};

export default Modal;
