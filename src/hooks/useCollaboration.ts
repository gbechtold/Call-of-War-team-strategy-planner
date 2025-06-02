import { useState, useEffect, useCallback, useRef } from 'react';
import { webrtcManager, type CollaborationMessage, extractRoomCodeFromUrl } from '../utils/webrtc';
import { useStrategyStore } from '../store/useStrategyStore';
import { useCurrentStrategy } from './useCurrentStrategy';
import { useConflictResolution } from './useConflictResolution';
import { type Task, type Strategy } from '../types';

interface CollaborationState {
  isConnected: boolean;
  roomCode: string | null;
  isHost: boolean;
  connectedPeers: number;
  username: string;
  isJoining: boolean;
  connectionError: string | null;
  lastSyncTime: Date | null;
}

export const useCollaboration = () => {
  const { strategy, tasks } = useCurrentStrategy();
  const { updateStrategy, createTask, updateTask, deleteTask } = useStrategyStore();
  
  // Generate a unique peer ID for this session
  const peerId = useRef(`peer-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`).current;
  
  // Initialize conflict resolution
  const conflictResolution = useConflictResolution(peerId);
  
  const [state, setState] = useState<CollaborationState>({
    isConnected: false,
    roomCode: null,
    isHost: false,
    connectedPeers: 0,
    username: 'User',
    isJoining: false,
    connectionError: null,
    lastSyncTime: null,
  });

  const processingMessage = useRef(false);

  // Initialize collaboration system
  useEffect(() => {
    // Set up WebRTC event handlers
    webrtcManager.onConnectionChange((connected) => {
      setState(prev => ({
        ...prev,
        isConnected: connected,
        connectionError: connected ? null : prev.connectionError,
      }));
    });

    webrtcManager.onMessage((message) => {
      handleIncomingMessage(message);
    });

    // Check for room code in URL on initialization
    const urlRoomCode = extractRoomCodeFromUrl();
    if (urlRoomCode && strategy) {
      setState(prev => ({ ...prev, isJoining: true }));
      joinRoom(urlRoomCode, state.username)
        .catch(error => {
          console.error('Auto-join failed:', error);
          setState(prev => ({ 
            ...prev, 
            isJoining: false,
            connectionError: 'Failed to join room from URL' 
          }));
        });
    }

    return () => {
      webrtcManager.disconnect();
    };
  }, [strategy?.id]);

  // Handle incoming WebRTC messages
  const handleIncomingMessage = useCallback(async (message: CollaborationMessage) => {
    if (processingMessage.current) return;
    processingMessage.current = true;

    try {
      console.log('Processing collaboration message:', message);

      // Convert collaboration message to operation format
      const operation = {
        id: message.messageId,
        type: message.type === 'strategy_update' ? 'update' as const :
              message.type === 'task_create' ? 'create' as const :
              message.type === 'task_update' ? 'update' as const :
              message.type === 'task_delete' ? 'delete' as const : 'update' as const,
        target: message.type.startsWith('strategy') ? 'strategy' as const : 'task' as const,
        targetId: message.payload.strategyId || message.payload.taskId || message.payload.task?.id || '',
        data: message.payload.updates || message.payload.task || message.payload,
        vectorClock: message.payload.vectorClock || {},
        timestamp: message.timestamp,
        author: message.author,
        dependencies: message.payload.dependencies || [],
      };

      // Process through conflict resolution system
      const resolution = conflictResolution.processRemoteOperation(operation);
      
      if (resolution) {
        console.log('Conflict resolution applied:', resolution);
      }

      switch (message.type) {

        case 'sync_request':
          // Send current strategy state to requesting peer
          await sendCurrentState();
          break;

        case 'user_joined':
          setState(prev => ({
            ...prev,
            connectedPeers: prev.connectedPeers + 1,
          }));
          break;

        case 'user_left':
          setState(prev => ({
            ...prev,
            connectedPeers: Math.max(0, prev.connectedPeers - 1),
          }));
          break;
      }

      setState(prev => ({ ...prev, lastSyncTime: new Date() }));
    } catch (error) {
      console.error('Error processing collaboration message:', error);
    } finally {
      processingMessage.current = false;
    }
  }, [strategy, tasks, updateStrategy, createTask, updateTask, deleteTask]);

  // Send current strategy state to peers
  const sendCurrentState = useCallback(async () => {
    if (!strategy) return;

    const strategyTasks = tasks.filter(t => t.strategyId === strategy.id);
    
    webrtcManager.sendMessage({
      type: 'strategy_update',
      payload: {
        strategy,
        tasks: strategyTasks,
        timestamp: new Date(),
      },
      timestamp: new Date(),
      author: state.username,
      messageId: `sync-${Date.now()}`,
    });
  }, [strategy, tasks, state.username]);

  // Create a new collaboration room
  const createRoom = useCallback(async (username: string = 'Host'): Promise<string | null> => {
    if (!strategy) {
      setState(prev => ({ ...prev, connectionError: 'No strategy selected' }));
      return null;
    }

    try {
      setState(prev => ({ ...prev, isJoining: true, connectionError: null }));
      
      const roomCode = await webrtcManager.createRoom(strategy.id, username);
      
      setState(prev => ({
        ...prev,
        isConnected: true,
        roomCode,
        isHost: true,
        username,
        isJoining: false,
      }));

      // Update URL with room code
      const newUrl = `${window.location.origin}${window.location.pathname}#room=${roomCode}`;
      window.history.pushState({}, '', newUrl);

      return roomCode;
    } catch (error) {
      console.error('Failed to create room:', error);
      setState(prev => ({ 
        ...prev, 
        isJoining: false,
        connectionError: 'Failed to create collaboration room' 
      }));
      return null;
    }
  }, [strategy]);

  // Join an existing collaboration room
  const joinRoom = useCallback(async (roomCode: string, username: string = 'Guest'): Promise<boolean> => {
    if (!strategy) {
      setState(prev => ({ ...prev, connectionError: 'No strategy selected' }));
      return false;
    }

    try {
      setState(prev => ({ ...prev, isJoining: true, connectionError: null }));
      
      const success = await webrtcManager.joinRoom(roomCode, strategy.id, username);
      
      if (success) {
        setState(prev => ({
          ...prev,
          isConnected: true,
          roomCode,
          isHost: false,
          username,
          isJoining: false,
        }));

        // Update URL with room code
        const newUrl = `${window.location.origin}${window.location.pathname}#room=${roomCode}`;
        window.history.pushState({}, '', newUrl);

        return true;
      } else {
        setState(prev => ({ 
          ...prev, 
          isJoining: false,
          connectionError: 'Failed to join room' 
        }));
        return false;
      }
    } catch (error) {
      console.error('Failed to join room:', error);
      setState(prev => ({ 
        ...prev, 
        isJoining: false,
        connectionError: 'Failed to join collaboration room' 
      }));
      return false;
    }
  }, [strategy]);

  // Leave collaboration room
  const leaveRoom = useCallback(async () => {
    await webrtcManager.disconnect();
    
    setState(prev => ({
      ...prev,
      isConnected: false,
      roomCode: null,
      isHost: false,
      connectedPeers: 0,
      connectionError: null,
    }));

    // Remove room code from URL
    const newUrl = `${window.location.origin}${window.location.pathname}`;
    window.history.pushState({}, '', newUrl);
  }, []);

  // Broadcast strategy changes to collaborators
  const broadcastChange = useCallback((type: CollaborationMessage['type'], payload: any) => {
    if (!state.isConnected) return;

    webrtcManager.broadcastStrategyUpdate(type, {
      ...payload,
      author: state.username,
      timestamp: new Date(),
    });
  }, [state.isConnected, state.username]);

  // Broadcast strategy update
  const broadcastStrategyUpdate = useCallback((updates: Partial<Strategy>) => {
    if (!strategy) return;
    
    broadcastChange('strategy_update', {
      strategyId: strategy.id,
      updates,
    });
  }, [strategy, broadcastChange]);

  // Broadcast task creation
  const broadcastTaskCreate = useCallback((task: Task) => {
    broadcastChange('task_create', { task });
  }, [broadcastChange]);

  // Broadcast task update
  const broadcastTaskUpdate = useCallback((taskId: string, updates: Partial<Task>) => {
    broadcastChange('task_update', { taskId, updates });
  }, [broadcastChange]);

  // Broadcast task deletion
  const broadcastTaskDelete = useCallback((taskId: string) => {
    broadcastChange('task_delete', { taskId });
  }, [broadcastChange]);

  // Generate shareable room link
  const getRoomLink = useCallback((): string | null => {
    if (!state.roomCode) return null;
    
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}#room=${state.roomCode}`;
  }, [state.roomCode]);

  // Set username
  const setUsername = useCallback((username: string) => {
    setState(prev => ({ ...prev, username }));
  }, []);

  // Clear connection error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, connectionError: null }));
  }, []);

  return {
    // State
    isConnected: state.isConnected,
    roomCode: state.roomCode,
    isHost: state.isHost,
    connectedPeers: state.connectedPeers,
    username: state.username,
    isJoining: state.isJoining,
    connectionError: state.connectionError,
    lastSyncTime: state.lastSyncTime,
    
    // Actions
    createRoom,
    joinRoom,
    leaveRoom,
    setUsername,
    clearError,
    getRoomLink,
    
    // Broadcasting (for integration with strategy operations)
    broadcastStrategyUpdate,
    broadcastTaskCreate,
    broadcastTaskUpdate,
    broadcastTaskDelete,
    
    // Conflict Resolution
    conflictResolution,
    peerId,
  };
};