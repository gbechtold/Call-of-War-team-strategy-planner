import React, { useState, useEffect } from 'react';
import { useStrategyStore } from '../../store/useStrategyStore';
import { useCurrentStrategy } from '../../hooks/useCurrentStrategy';
import { FaStickyNote, FaSave, FaDownload } from 'react-icons/fa';

export const StrategyNotes: React.FC = () => {
  const { updateStrategy } = useStrategyStore();
  const { strategy } = useCurrentStrategy();
  const [notes, setNotes] = useState(strategy?.notes || '');
  const [isSaved, setIsSaved] = useState(true);

  useEffect(() => {
    setNotes(strategy?.notes || '');
    setIsSaved(true);
  }, [strategy?.notes]);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
    setIsSaved(false);
  };

  const handleSave = () => {
    if (strategy) {
      updateStrategy(strategy.id, { notes });
      setIsSaved(true);
      
      // Also save to localStorage
      const storageKey = `strategy-notes-${strategy.id}`;
      localStorage.setItem(storageKey, notes);
    }
  };

  const handleDownload = () => {
    if (!strategy) return;
    
    const content = `Call of War Strategy Notes
========================
Strategy: ${strategy.name}
Date: ${new Date().toLocaleDateString()}

${notes}`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${strategy.name.replace(/\s+/g, '_')}_notes.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Auto-save after 2 seconds of inactivity
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isSaved && strategy) {
        handleSave();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [notes, isSaved]);

  return (
    <div className="bg-cod-secondary/90 backdrop-blur-sm p-3 rounded-lg shadow-2xl border-2 border-cod-accent/20 w-56">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bebas text-cod-accent flex items-center gap-2">
          <FaStickyNote /> Notes
        </h2>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className={`p-1 transition-colors ${
              isSaved 
                ? 'text-green-500' 
                : 'text-cod-accent hover:text-cod-accent/70'
            }`}
            title={isSaved ? 'Saved' : 'Save notes'}
          >
            <FaSave className="text-sm" />
          </button>
          <button
            onClick={handleDownload}
            className="p-1 text-cod-accent hover:text-cod-accent/70 transition-colors"
            title="Download notes"
          >
            <FaDownload className="text-sm" />
          </button>
        </div>
      </div>
      
      <textarea
        value={notes}
        onChange={handleNotesChange}
        placeholder="Add your strategy notes here..."
        className="w-full h-32 p-2 bg-cod-primary/50 border border-cod-accent/20 rounded text-sm text-gray-300 placeholder-gray-500 resize-none focus:border-cod-accent/50 focus:outline-none"
      />
      
      <div className="mt-2 text-xs text-gray-500">
        {!isSaved && <span className="text-cod-accent">• Unsaved changes</span>}
        {isSaved && notes && <span className="text-green-500">• Auto-saved</span>}
      </div>
    </div>
  );
};