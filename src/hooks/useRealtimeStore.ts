import { useCallback } from 'react';
import { useStrategyStore } from '../store/useStrategyStore';
import { useCollaboration } from '../contexts/CollaborationContext';
import { type Task, type Player, type Strategy } from '../types';

/**
 * Hook that wraps store actions with real-time broadcasting
 * Ensures all changes are synchronized across connected peers
 */
export const useRealtimeStore = () => {
  const store = useStrategyStore();
  const { isConnected, broadcastStrategyUpdate, broadcastTaskCreate, broadcastTaskUpdate, broadcastTaskDelete } = useCollaboration();

  // Wrap createTask to broadcast changes
  const createTask = useCallback((task: Omit<Task, 'id'>) => {
    // Create the task and get the created task with ID
    const createdTask = store.createTask(task);
    
    if (isConnected && createdTask) {
      broadcastTaskCreate(createdTask);
    }
    
    return createdTask;
  }, [store.createTask, isConnected, broadcastTaskCreate]);

  // Wrap updateTask to broadcast changes
  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    store.updateTask(id, updates);
    
    if (isConnected) {
      broadcastTaskUpdate(id, updates);
    }
  }, [store.updateTask, isConnected, broadcastTaskUpdate]);

  // Wrap deleteTask to broadcast changes
  const deleteTask = useCallback((id: string) => {
    store.deleteTask(id);
    
    if (isConnected) {
      broadcastTaskDelete(id);
    }
  }, [store.deleteTask, isConnected, broadcastTaskDelete]);

  // Wrap updateStrategy to broadcast changes (includes notes, milestones, etc.)
  const updateStrategy = useCallback((id: string, updates: Partial<Strategy>) => {
    store.updateStrategy(id, updates);
    
    if (isConnected) {
      broadcastStrategyUpdate(updates);
    }
  }, [store.updateStrategy, isConnected, broadcastStrategyUpdate]);

  // Wrap player actions to broadcast changes
  const addPlayer = useCallback((player: Omit<Player, 'id'>) => {
    store.addPlayer(player);
    
    if (isConnected) {
      // Get the current strategy and broadcast the player update
      const { currentStrategyId, players } = useStrategyStore.getState();
      if (currentStrategyId) {
        const newPlayer = players[players.length - 1];
        broadcastStrategyUpdate({ 
          players: [...(store.strategies.find(s => s.id === currentStrategyId)?.players || []), newPlayer.id] 
        });
      }
    }
  }, [store.addPlayer, isConnected, broadcastStrategyUpdate, store.strategies]);

  const updatePlayer = useCallback((id: string, updates: Partial<Player>) => {
    store.updatePlayer(id, updates);
    
    if (isConnected) {
      // Broadcast player update as a strategy update
      broadcastStrategyUpdate({ updatedAt: new Date() });
    }
  }, [store.updatePlayer, isConnected, broadcastStrategyUpdate]);

  const removePlayer = useCallback((id: string) => {
    store.removePlayer(id);
    
    if (isConnected) {
      // Get the current strategy and broadcast the player removal
      const { currentStrategyId } = useStrategyStore.getState();
      const strategy = store.strategies.find(s => s.id === currentStrategyId);
      if (strategy) {
        broadcastStrategyUpdate({ 
          players: strategy.players?.filter(p => p !== id) || []
        });
      }
    }
  }, [store.removePlayer, isConnected, broadcastStrategyUpdate, store.strategies]);

  // Return all store actions, with real-time wrappers where applicable
  return {
    // Use wrapped versions for actions that modify data
    createTask,
    updateTask,
    deleteTask,
    updateStrategy,
    addPlayer,
    updatePlayer,
    removePlayer,
    
    // Pass through read-only actions and other store properties
    strategies: store.strategies,
    currentStrategyId: store.currentStrategyId,
    tasks: store.tasks,
    players: store.players,
    createStrategy: store.createStrategy,
    deleteStrategy: store.deleteStrategy,
    setCurrentStrategy: store.setCurrentStrategy,
    saveStrategyWithCode: store.saveStrategyWithCode,
    loadStrategyFromCode: store.loadStrategyFromCode,
  };
};