import React, { useState } from 'react';
import { useRevisionSystem } from '../../hooks/useRevisionSystem';
import { FaHistory, FaDownload, FaUndo, FaUser, FaRobot, FaSave, FaCog, FaTimes } from 'react-icons/fa';
import { format, formatDistanceToNow } from 'date-fns';

export const RevisionHistory: React.FC = () => {
  const {
    revisions,
    syncSettings,
    isAutoSaving,
    lastSaveTime,
    hasUnsavedChanges,
    saveRevision,
    restoreRevision,
    updateSyncSettings,
    exportRevision,
  } = useRevisionSystem();

  const [showSettings, setShowSettings] = useState(false);
  const [restoreConfirm, setRestoreConfirm] = useState<string | null>(null);
  const [saveDescription, setSaveDescription] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const handleManualSave = async () => {
    if (saveDescription.trim()) {
      await saveRevision(saveDescription.trim(), false);
      setSaveDescription('');
      setShowSaveDialog(false);
    }
  };

  const handleRestore = async (revisionId: string) => {
    const success = await restoreRevision(revisionId);
    if (success) {
      setRestoreConfirm(null);
    }
  };

  const getSyncModeLabel = (mode: string) => {
    switch (mode) {
      case 'manual': return 'Manual only';
      case 'auto': return 'Auto-save';
      case 'live': return 'Live sync';
      default: return mode;
    }
  };

  return (
    <div className="bg-cod-secondary/90 backdrop-blur-sm p-3 rounded-lg shadow-2xl border-2 border-cod-accent/20 w-56">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bebas text-cod-accent flex items-center gap-2">
          <FaHistory /> History
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 text-cod-accent hover:text-cod-accent/70 transition-colors"
            title="Sync settings"
          >
            <FaCog className="text-sm" />
          </button>
          <button
            onClick={() => setShowSaveDialog(true)}
            disabled={!hasUnsavedChanges}
            className={`p-1 transition-colors ${
              hasUnsavedChanges 
                ? 'text-cod-accent hover:text-cod-accent/70' 
                : 'text-gray-500 cursor-not-allowed'
            }`}
            title="Manual save"
          >
            <FaSave className="text-sm" />
          </button>
        </div>
      </div>

      {/* Sync Status */}
      <div className="mb-3 p-2 bg-cod-primary/30 rounded border border-cod-accent/20">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${
              syncSettings.enabled ? 'bg-green-500' : 'bg-gray-500'
            }`} />
            <span className="text-gray-300">{getSyncModeLabel(syncSettings.mode)}</span>
          </div>
          {isAutoSaving && (
            <div className="flex items-center gap-1 text-cod-accent">
              <div className="animate-spin w-3 h-3 border border-cod-accent border-t-transparent rounded-full" />
              <span>Saving...</span>
            </div>
          )}
        </div>
        {lastSaveTime && (
          <div className="text-[10px] text-gray-500 mt-1">
            Last saved: {formatDistanceToNow(lastSaveTime, { addSuffix: true })}
          </div>
        )}
        {hasUnsavedChanges && (
          <div className="text-[10px] text-orange-400 mt-1">
            • Unsaved changes
          </div>
        )}
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-3 p-3 bg-cod-primary/30 rounded border border-cod-accent/20">
          <h3 className="text-sm font-bebas text-cod-accent mb-2">Sync Settings</h3>
          
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={syncSettings.enabled}
                onChange={(e) => updateSyncSettings({ enabled: e.target.checked })}
                className="rounded"
              />
              <span className="text-gray-300">Enable auto-sync</span>
            </label>

            <div className="space-y-1">
              <label className="text-xs text-gray-400">Sync mode:</label>
              <select
                value={syncSettings.mode}
                onChange={(e) => updateSyncSettings({ mode: e.target.value as any })}
                disabled={!syncSettings.enabled}
                className="w-full p-1 bg-cod-secondary border border-cod-accent/30 rounded text-xs text-gray-300"
              >
                <option value="manual">Manual only</option>
                <option value="auto">Auto-save</option>
                <option value="live">Live sync</option>
              </select>
            </div>

            {syncSettings.mode === 'auto' && (
              <div className="space-y-1">
                <label className="text-xs text-gray-400">Interval (seconds):</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={syncSettings.autoSaveInterval / 1000}
                  onChange={(e) => updateSyncSettings({ 
                    autoSaveInterval: parseInt(e.target.value) * 1000 
                  })}
                  className="w-full p-1 bg-cod-secondary border border-cod-accent/30 rounded text-xs text-gray-300"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual Save Dialog */}
      {showSaveDialog && (
        <div className="mb-3 p-3 bg-cod-primary/30 rounded border border-cod-accent/20">
          <h3 className="text-sm font-bebas text-cod-accent mb-2">Save Changes</h3>
          <input
            type="text"
            placeholder="Describe your changes..."
            value={saveDescription}
            onChange={(e) => setSaveDescription(e.target.value)}
            className="w-full p-2 bg-cod-secondary border border-cod-accent/30 rounded text-xs text-gray-300 placeholder-gray-500 mb-2"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleManualSave}
              disabled={!saveDescription.trim()}
              className="flex-1 px-2 py-1 bg-cod-accent text-cod-primary rounded text-xs font-bebas hover:bg-cod-accent/90 transition-colors disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={() => {
                setShowSaveDialog(false);
                setSaveDescription('');
              }}
              className="px-2 py-1 bg-gray-600 text-white rounded text-xs font-bebas hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Revisions List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {revisions.length === 0 ? (
          <p className="text-gray-500 text-sm text-left py-4">
            No revisions saved yet
          </p>
        ) : (
          revisions.map((revision) => (
            <div
              key={revision.id}
              className="p-2 bg-cod-primary/30 rounded border border-cod-accent/20 hover:border-cod-accent/40 transition-colors"
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bebas text-cod-accent">
                      v{revision.version}
                    </span>
                    {revision.isAutoSave ? (
                      <FaRobot className="text-[8px] text-gray-400" title="Auto-save" />
                    ) : (
                      <FaUser className="text-[8px] text-gray-400" title="Manual save" />
                    )}
                  </div>
                  <p className="text-[10px] text-gray-300 mt-1 line-clamp-2">
                    {revision.changeDescription}
                  </p>
                  <p className="text-[8px] text-gray-500 mt-1">
                    {format(new Date(revision.timestamp), 'MMM d, HH:mm')}
                  </p>
                </div>
                <div className="flex flex-col gap-1 ml-2">
                  <button
                    onClick={() => exportRevision(revision.id)}
                    className="p-1 text-gray-400 hover:text-cod-accent transition-colors"
                    title="Export revision"
                  >
                    <FaDownload className="text-[8px]" />
                  </button>
                  <button
                    onClick={() => setRestoreConfirm(revision.id)}
                    className="p-1 text-gray-400 hover:text-orange-400 transition-colors"
                    title="Restore revision"
                  >
                    <FaUndo className="text-[8px]" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Restore Confirmation Dialog */}
      {restoreConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-black opacity-75" onClick={() => setRestoreConfirm(null)}></div>
            
            <div className="relative bg-cod-primary border-2 border-cod-accent rounded-lg shadow-2xl max-w-md w-full">
              <div className="flex items-center justify-between p-4 border-b border-cod-accent/30">
                <h3 className="text-2xl font-bebas text-cod-accent">Restore Revision</h3>
                <button
                  onClick={() => setRestoreConfirm(null)}
                  className="text-cod-accent hover:text-cod-accent/70 focus:outline-none transition-colors"
                >
                  <FaTimes className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-6 bg-cod-secondary/50">
                <p className="text-gray-300 mb-6">
                  Are you sure you want to restore this revision? This will overwrite all current changes.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setRestoreConfirm(null)}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors font-bebas"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleRestore(restoreConfirm)}
                    className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors font-bebas"
                  >
                    Restore
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500 mt-3 text-left">
        Revisions are saved locally
      </p>
    </div>
  );
};