import React from 'react';
import { FaTimes } from 'react-icons/fa';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black opacity-75" onClick={onClose}></div>
        
        <div className="relative bg-cod-primary border-2 border-cod-accent rounded-lg shadow-2xl max-w-2xl w-full animate-fadeIn">
          <div className="flex items-center justify-between p-4 border-b border-cod-accent/30">
            <h3 className="text-2xl font-bebas text-cod-accent">{title}</h3>
            <button
              onClick={onClose}
              className="text-cod-accent hover:text-cod-accent/70 focus:outline-none transition-colors"
            >
              <FaTimes className="h-5 w-5" />
            </button>
          </div>
          
          <div className="p-6 bg-cod-secondary/50">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};