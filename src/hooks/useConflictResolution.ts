import { useState, useEffect, useCallback, useRef } from 'react';
import { getOTEngine, type Operation, type ConflictResolution, type VectorClock } from '../utils/operationalTransform';
import { useStrategyStore } from '../store/useStrategyStore';
import { useCurrentStrategy } from './useCurrentStrategy';
import { type Task, type Strategy } from '../types';

interface ConflictState {
  pendingConflicts: ConflictResolution[];
  isProcessingConflicts: boolean;
  conflictHistory: ConflictResolution[];
  lastResolutionTime: Date | null;
}

interface ConflictNotification {
  id: string;
  type: 'merge' | 'override' | 'dependency_wait';
  message: string;
  timestamp: Date;
  operation: Operation;
  autoResolve: boolean;
}

export const useConflictResolution = (peerId: string) => {
  const { strategy } = useCurrentStrategy();
  const { updateStrategy, createTask, updateTask, deleteTask } = useStrategyStore();
  
  const [conflictState, setConflictState] = useState<ConflictState>({
    pendingConflicts: [],
    isProcessingConflicts: false,
    conflictHistory: [],
    lastResolutionTime: null,
  });

  const [notifications, setNotifications] = useState<ConflictNotification[]>([]);
  const otEngineRef = useRef<ReturnType<typeof getOTEngine> | null>(null);
  const processingRef = useRef(false);

  // Initialize OT engine
  useEffect(() => {
    if (peerId && !otEngineRef.current) {
      otEngineRef.current = getOTEngine(peerId);
    }
  }, [peerId]);

  // Create operation for local changes
  const createLocalOperation = useCallback((
    type: Operation['type'],
    target: Operation['target'],
    targetId: string,
    data: any,
    dependencies: string[] = []
  ): Operation | null => {
    if (!otEngineRef.current) return null;

    const operation = otEngineRef.current.createOperation(type, target, targetId, data, dependencies);
    
    // Add to conflict history for tracking
    setConflictState(prev => ({
      ...prev,
      conflictHistory: [...prev.conflictHistory.slice(-50), {
        operation,
        resolvedOperation: operation,
        conflictType: 'concurrent_edit',
        resolution: 'accept',
      }],
    }));

    return operation;
  }, []);

  // Process remote operation with conflict resolution
  const processRemoteOperation = useCallback((operation: Operation): ConflictResolution | null => {
    if (!otEngineRef.current || processingRef.current) return null;

    processingRef.current = true;
    
    try {
      const resolution = otEngineRef.current.applyRemoteOperation(operation);
      
      // Update conflict state
      setConflictState(prev => ({
        ...prev,
        conflictHistory: [...prev.conflictHistory.slice(-50), resolution],
        lastResolutionTime: new Date(),
      }));

      // Handle different resolution types
      switch (resolution.resolution) {
        case 'accept':
          applyOperationToStore(resolution.resolvedOperation);
          break;
          
        case 'merge':
          applyOperationToStore(resolution.resolvedOperation);
          showConflictNotification(resolution, 'merge');
          break;
          
        case 'reject':
          if (resolution.conflictType === 'dependency_violation') {
            showConflictNotification(resolution, 'dependency_wait');
          }
          break;
          
        case 'transform':
          applyOperationToStore(resolution.resolvedOperation);
          showConflictNotification(resolution, 'override');
          break;
      }

      return resolution;
    } finally {
      processingRef.current = false;
    }
  }, []);

  // Apply operation to Zustand store
  const applyOperationToStore = useCallback((operation: Operation) => {
    switch (operation.target) {
      case 'strategy':
        if (strategy && operation.type === 'update') {
          updateStrategy(operation.targetId, operation.data);
        }
        break;
        
      case 'task':
        switch (operation.type) {
          case 'create':
            createTask(operation.data);
            break;
          case 'update':
            updateTask(operation.targetId, operation.data);
            break;
          case 'delete':
            deleteTask(operation.targetId);
            break;
        }
        break;
        
      // Additional cases for milestones, players, etc. would go here
    }
  }, [strategy, updateStrategy, createTask, updateTask, deleteTask]);

  // Show conflict notification to user
  const showConflictNotification = useCallback((resolution: ConflictResolution, type: ConflictNotification['type']) => {
    const notification: ConflictNotification = {
      id: `conflict-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      type,
      message: generateConflictMessage(resolution, type),
      timestamp: new Date(),
      operation: resolution.operation,
      autoResolve: resolution.resolution !== 'reject',
    };

    setNotifications(prev => [...prev.slice(-10), notification]);

    // Auto-dismiss non-critical notifications
    if (notification.autoResolve) {
      setTimeout(() => {
        dismissNotification(notification.id);
      }, 5000);
    }
  }, []);

  // Generate human-readable conflict message
  const generateConflictMessage = (resolution: ConflictResolution, type: ConflictNotification['type']): string => {
    const { operation, conflictType } = resolution;
    const authorName = operation.author === peerId ? 'You' : `User ${operation.author.substring(0, 8)}`;
    
    switch (type) {
      case 'merge':
        return `Merged conflicting changes to ${operation.target} by ${authorName}`;
      case 'override':
        return `Applied transformed operation from ${authorName} to resolve ordering conflict`;
      case 'dependency_wait':
        return `Waiting for dependencies before applying changes from ${authorName}`;
      default:
        return `Resolved ${conflictType} from ${authorName}`;
    }
  };

  // Dismiss notification
  const dismissNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  // Process pending operations periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (otEngineRef.current && !processingRef.current) {
        const resolutions = otEngineRef.current.processPendingOperations();
        
        if (resolutions.length > 0) {
          resolutions.forEach(resolution => {
            if (resolution.resolution === 'accept') {
              applyOperationToStore(resolution.resolvedOperation);
            }
          });

          setConflictState(prev => ({
            ...prev,
            conflictHistory: [...prev.conflictHistory.slice(-50), ...resolutions],
            lastResolutionTime: new Date(),
          }));
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [applyOperationToStore]);

  // Cleanup old history periodically
  useEffect(() => {
    const cleanup = setInterval(() => {
      if (otEngineRef.current) {
        otEngineRef.current.cleanupHistory(1000);
      }
      
      // Clean up old notifications
      setNotifications(prev => prev.filter(n => 
        Date.now() - n.timestamp.getTime() < 300000 // 5 minutes
      ));
    }, 60000); // Every minute

    return () => clearInterval(cleanup);
  }, []);

  // Strategy operation helpers with OT integration
  const createStrategyUpdate = useCallback((updates: Partial<Strategy>): Operation | null => {
    if (!strategy) return null;
    return createLocalOperation('update', 'strategy', strategy.id, updates);
  }, [strategy, createLocalOperation]);

  const createTaskOperation = useCallback((
    type: 'create' | 'update' | 'delete',
    taskId: string,
    data?: Partial<Task>
  ): Operation | null => {
    return createLocalOperation(type, 'task', taskId, data);
  }, [createLocalOperation]);

  const createTaskMoveOperation = useCallback((
    taskId: string,
    fromIndex: number,
    toIndex: number,
    newCategory?: string
  ): Operation | null => {
    return createLocalOperation('move', 'task', taskId, {
      fromIndex,
      toIndex,
      newCategory,
    });
  }, [createLocalOperation]);

  // Get current vector clock for synchronization
  const getVectorClock = useCallback((): VectorClock | null => {
    return otEngineRef.current?.getVectorClock() || null;
  }, []);

  // Get conflict statistics
  const getConflictStats = useCallback(() => {
    const history = conflictState.conflictHistory;
    const recentConflicts = history.filter(r => 
      Date.now() - r.operation.timestamp.getTime() < 3600000 // Last hour
    );

    return {
      totalConflicts: history.length,
      recentConflicts: recentConflicts.length,
      resolutionTypes: {
        accept: history.filter(r => r.resolution === 'accept').length,
        merge: history.filter(r => r.resolution === 'merge').length,
        transform: history.filter(r => r.resolution === 'transform').length,
        reject: history.filter(r => r.resolution === 'reject').length,
      },
      conflictTypes: {
        concurrent_edit: history.filter(r => r.conflictType === 'concurrent_edit').length,
        dependency_violation: history.filter(r => r.conflictType === 'dependency_violation').length,
        ordering_conflict: history.filter(r => r.conflictType === 'ordering_conflict').length,
      },
    };
  }, [conflictState.conflictHistory]);

  return {
    // State
    conflictState,
    notifications,
    
    // Operations
    createLocalOperation,
    processRemoteOperation,
    
    // Strategy-specific helpers
    createStrategyUpdate,
    createTaskOperation,
    createTaskMoveOperation,
    
    // Utilities
    getVectorClock,
    dismissNotification,
    getConflictStats,
    
    // Status
    isProcessing: conflictState.isProcessingConflicts,
    hasConflicts: conflictState.pendingConflicts.length > 0,
    lastResolution: conflictState.lastResolutionTime,
  };
};