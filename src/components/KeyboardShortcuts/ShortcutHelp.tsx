import React from 'react';
import { FaTimes, FaKeyboard } from 'react-icons/fa';
import { formatShortcut, type KeyboardShortcut } from '../../hooks/useKeyboardShortcuts';

interface ShortcutHelpProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: KeyboardShortcut[];
}

export const ShortcutHelp: React.FC<ShortcutHelpProps> = ({ isOpen, onClose, shortcuts }) => {
  if (!isOpen) return null;

  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black opacity-75" onClick={onClose}></div>
        
        <div className="relative bg-cod-primary border-2 border-cod-accent rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-cod-accent/30">
            <h2 className="text-2xl font-bebas text-cod-accent flex items-center gap-2">
              <FaKeyboard /> Keyboard Shortcuts
            </h2>
            <button
              onClick={onClose}
              className="text-cod-accent hover:text-cod-accent/70 focus:outline-none transition-colors"
            >
              <FaTimes className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto custom-scrollbar max-h-[60vh]">
            <div className="space-y-6">
              {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
                <div key={category}>
                  <h3 className="text-lg font-bebas text-cod-accent mb-3 border-b border-cod-accent/20 pb-1">
                    {category}
                  </h3>
                  <div className="grid gap-2">
                    {categoryShortcuts.map((shortcut, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-cod-secondary/30 rounded">
                        <span className="text-gray-300 text-sm">{shortcut.description}</span>
                        <div className="flex items-center gap-1">
                          <span className="px-2 py-1 bg-cod-accent/20 border border-cod-accent/30 rounded text-cod-accent font-mono text-xs">
                            {formatShortcut(shortcut)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-cod-accent/20">
              <p className="text-xs text-gray-500 text-center">
                Press <span className="px-1 py-0.5 bg-cod-accent/20 rounded font-mono">?</span> anytime to open this help menu
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};