import { useState, useEffect, useCallback, useRef } from 'react';
import { dbManager, type StrategyRevision, type SyncSettings } from '../utils/indexedDB';
import { useStrategyStore } from '../store/useStrategyStore';
import { useCurrentStrategy } from './useCurrentStrategy';

interface RevisionSystemState {
  revisions: StrategyRevision[];
  syncSettings: SyncSettings;
  isAutoSaving: boolean;
  lastSaveTime: Date | null;
  hasUnsavedChanges: boolean;
}

export const useRevisionSystem = () => {
  const { strategy, tasks } = useCurrentStrategy();
  const { players } = useStrategyStore();
  
  const [state, setState] = useState<RevisionSystemState>({
    revisions: [],
    syncSettings: {
      enabled: true,
      mode: 'auto',
      autoSaveInterval: 2000,
    },
    isAutoSaving: false,
    lastSaveTime: null,
    hasUnsavedChanges: false,
  });

  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<string>('');

  // Get milestones from localStorage
  const getMilestones = useCallback(() => {
    if (!strategy) return [];
    const storageKey = `milestones-${strategy.id}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  }, [strategy]);

  // Load revisions and sync settings
  useEffect(() => {
    const loadData = async () => {
      if (!strategy) return;

      try {
        const [revisions, syncSettings] = await Promise.all([
          dbManager.getRevisions(strategy.id),
          dbManager.getSyncSettings(strategy.id),
        ]);

        setState(prev => ({
          ...prev,
          revisions,
          syncSettings,
        }));
      } catch (error) {
        console.error('Failed to load revision data:', error);
      }
    };

    loadData();
  }, [strategy?.id]);

  // Check for unsaved changes
  useEffect(() => {
    if (!strategy) return;

    const currentData = JSON.stringify({
      strategy,
      tasks: tasks.filter(t => t.strategyId === strategy.id),
      players,
      milestones: getMilestones(),
    });

    const hasChanges = currentData !== lastSavedDataRef.current && lastSavedDataRef.current !== '';
    
    setState(prev => ({
      ...prev,
      hasUnsavedChanges: hasChanges,
    }));
  }, [strategy, tasks, players, getMilestones]);

  // Auto-save logic
  useEffect(() => {
    if (!strategy || !state.syncSettings.enabled || state.syncSettings.mode !== 'auto') {
      return;
    }

    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    autoSaveTimer.current = setTimeout(() => {
      if (state.hasUnsavedChanges) {
        saveRevision('Auto-save', true);
      }
    }, state.syncSettings.autoSaveInterval);

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [strategy, tasks, players, state.syncSettings, state.hasUnsavedChanges]);

  // Save revision function
  const saveRevision = useCallback(async (changeDescription: string = 'Manual save', isAutoSave: boolean = false) => {
    if (!strategy) return null;

    setState(prev => ({ ...prev, isAutoSaving: true }));

    try {
      const version = await dbManager.getNextVersion(strategy.id);
      const milestones = getMilestones();
      
      const revisionData = {
        strategyId: strategy.id,
        version,
        timestamp: new Date(),
        author: 'User', // TODO: Get from user context
        strategy,
        tasks: tasks.filter(t => t.strategyId === strategy.id),
        players,
        milestones,
        changeDescription,
        isAutoSave,
      };

      const revisionId = await dbManager.saveRevision(revisionData);
      
      // Update last saved data reference
      lastSavedDataRef.current = JSON.stringify({
        strategy,
        tasks: revisionData.tasks,
        players,
        milestones,
      });

      // Reload revisions
      const updatedRevisions = await dbManager.getRevisions(strategy.id);
      
      setState(prev => ({
        ...prev,
        revisions: updatedRevisions,
        isAutoSaving: false,
        lastSaveTime: new Date(),
        hasUnsavedChanges: false,
      }));

      // Cleanup old revisions (keep last 50)
      await dbManager.cleanupOldRevisions(strategy.id, 50);

      return revisionId;
    } catch (error) {
      console.error('Failed to save revision:', error);
      setState(prev => ({ ...prev, isAutoSaving: false }));
      return null;
    }
  }, [strategy, tasks, players, getMilestones]);

  // Restore revision function
  const restoreRevision = useCallback(async (revisionId: string) => {
    const revision = state.revisions.find(r => r.id === revisionId);
    if (!revision || !strategy) return false;

    try {
      // Update Zustand store
      const { updateStrategy, createTask, deleteTask } = useStrategyStore.getState();
      
      // Update strategy
      updateStrategy(strategy.id, revision.strategy);
      
      // Update tasks
      const currentTasks = tasks.filter(t => t.strategyId === strategy.id);
      for (const task of currentTasks) {
        deleteTask(task.id);
      }
      for (const task of revision.tasks) {
        createTask(task);
      }
      
      // Update milestones
      const storageKey = `milestones-${strategy.id}`;
      localStorage.setItem(storageKey, JSON.stringify(revision.milestones));
      window.dispatchEvent(new Event('milestonesUpdated'));
      
      // Save restore action as new revision
      await saveRevision(`Restored to v${revision.version}`, false);
      
      return true;
    } catch (error) {
      console.error('Failed to restore revision:', error);
      return false;
    }
  }, [state.revisions, strategy, tasks, saveRevision]);

  // Update sync settings
  const updateSyncSettings = useCallback(async (updates: Partial<SyncSettings>) => {
    if (!strategy) return;

    try {
      await dbManager.updateSyncSettings(strategy.id, updates);
      const updatedSettings = await dbManager.getSyncSettings(strategy.id);
      
      setState(prev => ({
        ...prev,
        syncSettings: updatedSettings,
      }));
    } catch (error) {
      console.error('Failed to update sync settings:', error);
    }
  }, [strategy]);

  // Export revision as JSON
  const exportRevision = useCallback((revisionId: string) => {
    const revision = state.revisions.find(r => r.id === revisionId);
    if (!revision) return;

    const exportData = {
      strategy: revision.strategy,
      tasks: revision.tasks,
      players: revision.players,
      milestones: revision.milestones,
      metadata: {
        version: revision.version,
        timestamp: revision.timestamp,
        author: revision.author,
        description: revision.changeDescription,
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${revision.strategy.name}_v${revision.version}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [state.revisions]);

  return {
    // State
    revisions: state.revisions,
    syncSettings: state.syncSettings,
    isAutoSaving: state.isAutoSaving,
    lastSaveTime: state.lastSaveTime,
    hasUnsavedChanges: state.hasUnsavedChanges,
    
    // Actions
    saveRevision,
    restoreRevision,
    updateSyncSettings,
    exportRevision,
  };
};