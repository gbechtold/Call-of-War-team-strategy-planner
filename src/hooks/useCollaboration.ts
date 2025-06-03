import { useState, useEffect, useCallback, useRef } from 'react';
import { webrtcManager, type CollaborationMessage, extractRoomCodeFromUrl } from '../utils/webrtc';
import { webrtcMeshManager } from '../utils/webrtcMesh';
import { COLLABORATION_CONFIG } from '../config/collaboration';
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
  recentUpdates: Set<string>; // Track recently updated elements for animations
  peerUsernames: Map<string, string>; // Track usernames of connected peers
}

export const useCollaboration = () => {
  const { strategy, tasks } = useCurrentStrategy();
  const { updateStrategy, createTask, updateTask, deleteTask } = useStrategyStore();
  
  // Select the appropriate WebRTC manager based on configuration
  const rtcManager = COLLABORATION_CONFIG.USE_MESH_NETWORKING ? webrtcMeshManager : webrtcManager;
  
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
    recentUpdates: new Set<string>(),
    peerUsernames: new Map<string, string>(),
  });

  const processingMessage = useRef(false);
  const processedMessages = useRef(new Set<string>());

  // Add animation tracking for updates
  const addRecentUpdate = useCallback((elementId: string) => {
    setState(prev => {
      const newRecentUpdates = new Set(prev.recentUpdates);
      newRecentUpdates.add(elementId);
      return { ...prev, recentUpdates: newRecentUpdates };
    });
    
    // Remove from recent updates after animation duration
    setTimeout(() => {
      setState(prev => {
        const newRecentUpdates = new Set(prev.recentUpdates);
        newRecentUpdates.delete(elementId);
        return { ...prev, recentUpdates: newRecentUpdates };
      });
    }, 1000); // Match longest animation duration
  }, []);

  // Check if an element was recently updated (for animation classes)
  const isRecentlyUpdated = useCallback((elementId: string) => {
    return state.recentUpdates.has(elementId);
  }, [state.recentUpdates]);

  // Initialize collaboration system
  useEffect(() => {
    console.log('[Collaboration] Setting up WebRTC event handlers');
    
    // Set up WebRTC event handlers
    const unsubscribeConnection = rtcManager.onConnectionChange((connected) => {
      console.log('[Collaboration] Connection state changed:', connected);
      setState(prev => ({
        ...prev,
        isConnected: connected,
        connectionError: connected ? null : prev.connectionError,
      }));
    });

    const unsubscribeMessage = rtcManager.onMessage((message) => {
      handleIncomingMessage(message);
    });

    // Set up peer count monitoring
    const unsubscribePeerCount = rtcManager.onPeerCountChange((count) => {
      console.log('[Collaboration] Peer count changed:', count);
      setState(prev => ({
        ...prev,
        connectedPeers: count,
      }));
    });

    return () => {
      console.log('[Collaboration] Cleaning up event handlers');
      if (typeof unsubscribeConnection === 'function') unsubscribeConnection();
      if (typeof unsubscribeMessage === 'function') unsubscribeMessage();
      if (typeof unsubscribePeerCount === 'function') unsubscribePeerCount();
      rtcManager.leaveRoom();
    };
  }, []);

  // Handle auto-join from URL when strategy becomes available
  useEffect(() => {
    const urlRoomCode = extractRoomCodeFromUrl();
    if (urlRoomCode && strategy && !state.isConnected && !state.isJoining) {
      console.log('[Collaboration] Auto-joining room from URL:', urlRoomCode);
      setState(prev => ({ ...prev, isJoining: true, connectionError: null }));
      
      // First try to join as a guest
      joinRoom(urlRoomCode, state.username || 'Guest')
        .then(success => {
          console.log('[Collaboration] Auto-join result:', success);
          if (!success) {
            // If join fails, this might be a new room, so try to create it
            console.log('[Collaboration] Join failed, attempting to create room with same code');
            // For the original webrtc manager, we can't create with a specific code
            // So we'll just clear the joining state and let them manually create/join
            setState(prev => ({ 
              ...prev, 
              isJoining: false,
              connectionError: `Room ${urlRoomCode} not found. You can create a new room or try again.` 
            }));
          }
        })
        .catch(error => {
          console.error('[Collaboration] Auto-join failed:', error);
          setState(prev => ({ 
            ...prev, 
            isJoining: false,
            connectionError: `Failed to join room ${urlRoomCode}. The room may not exist or be offline.` 
          }));
        });
    }
  }, [strategy?.id, state.isConnected, state.isJoining, state.username]);

  // Handle incoming WebRTC messages
  const handleIncomingMessage = useCallback(async (message: CollaborationMessage) => {
    // Prevent duplicate message processing
    if (processedMessages.current.has(message.messageId)) {
      console.log('Skipping duplicate message:', message.messageId);
      return;
    }
    processedMessages.current.add(message.messageId);
    
    // Clean up old message IDs (keep last 1000)
    if (processedMessages.current.size > 1000) {
      const oldestIds = Array.from(processedMessages.current).slice(0, 500);
      oldestIds.forEach(id => processedMessages.current.delete(id));
    }

    if (processingMessage.current) return;
    processingMessage.current = true;

    try {
      console.log('Processing collaboration message:', message);

      // Only apply conflict resolution to data operations, not chat/system messages
      const needsConflictResolution = ['strategy_update', 'task_create', 'task_update', 'task_delete'].includes(message.type);
      
      if (needsConflictResolution) {
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
      }

      switch (message.type) {

        case 'sync_request':
          // Send current strategy state to requesting peer
          await sendCurrentState();
          break;

        case 'user_joined':
          setState(prev => {
            const newPeerUsernames = new Map(prev.peerUsernames);
            if (message.payload.peerId && message.payload.username) {
              newPeerUsernames.set(message.payload.peerId, message.payload.username);
            }
            return {
              ...prev,
              connectedPeers: prev.connectedPeers + 1,
              peerUsernames: newPeerUsernames,
            };
          });
          break;

        case 'user_left':
          setState(prev => {
            const newPeerUsernames = new Map(prev.peerUsernames);
            if (message.payload.peerId) {
              newPeerUsernames.delete(message.payload.peerId);
            }
            return {
              ...prev,
              connectedPeers: Math.max(0, prev.connectedPeers - 1),
              peerUsernames: newPeerUsernames,
            };
          });
          break;

        case 'username_update':
          if (message.payload.peerId && message.payload.username) {
            setState(prev => {
              const newPeerUsernames = new Map(prev.peerUsernames);
              newPeerUsernames.set(message.payload.peerId, message.payload.username);
              return {
                ...prev,
                peerUsernames: newPeerUsernames,
              };
            });
            addRecentUpdate(`username-${message.payload.peerId}`);
          }
          break;

        case 'strategy_update':
          if (message.payload.strategy && message.payload.strategy.id === strategy?.id) {
            updateStrategy(message.payload.strategy.id, message.payload.strategy);
            addRecentUpdate(`strategy-${message.payload.strategy.id}`);
          }
          break;

        case 'task_create':
          if (message.payload.task && !needsConflictResolution) {
            // Only handle task creation if conflict resolution didn't already process it
            console.log('[Collaboration] Received task_create (direct):', {
              taskId: message.payload.task.id,
              author: message.author,
              messageId: message.messageId,
              timestamp: message.timestamp
            });
            
            // Convert date strings back to Date objects
            const task = {
              ...message.payload.task,
              startDate: new Date(message.payload.task.startDate),
              endDate: new Date(message.payload.task.endDate),
              createdAt: message.payload.task.createdAt ? new Date(message.payload.task.createdAt) : new Date(),
              updatedAt: message.payload.task.updatedAt ? new Date(message.payload.task.updatedAt) : new Date(),
            };
            
            createTask(task);
            addRecentUpdate(`task-${task.id}`);
          } else if (message.payload.task) {
            console.log('[Collaboration] Task already processed by conflict resolution:', message.payload.task.id);
          }
          break;

        case 'task_update':
          if (message.payload.taskId && message.payload.updates) {
            updateTask(message.payload.taskId, message.payload.updates);
            addRecentUpdate(`task-${message.payload.taskId}`);
          }
          break;

        case 'task_delete':
          if (message.payload.taskId) {
            deleteTask(message.payload.taskId);
            addRecentUpdate(`task-delete-${message.payload.taskId}`);
          }
          break;
      }

      setState(prev => ({ ...prev, lastSyncTime: new Date() }));
    } catch (error) {
      console.error('Error processing collaboration message:', error);
    } finally {
      processingMessage.current = false;
    }
  }, [strategy, tasks, updateStrategy, createTask, updateTask, deleteTask, addRecentUpdate, conflictResolution]);

  // Send current strategy state to peers
  const sendCurrentState = useCallback(async () => {
    if (!strategy) return;

    const strategyTasks = tasks.filter(t => t.strategyId === strategy.id);
    
    rtcManager.sendMessage({
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

  // Create a new collaboration room with retry logic
  const createRoom = useCallback(async (username: string = 'Host', retryCount: number = 0): Promise<string | null> => {
    if (!strategy) {
      console.error('[Collaboration] No strategy selected for room creation');
      setState(prev => ({ ...prev, connectionError: 'No strategy selected' }));
      return null;
    }

    try {
      console.log('[Collaboration] Creating room (attempt', retryCount + 1, ') with strategy:', strategy.id, 'username:', username);
      setState(prev => ({ ...prev, isJoining: true, connectionError: null }));
      
      const roomCode = await rtcManager.createRoom(strategy.id, username);
      console.log('[Collaboration] Room creation result:', roomCode);
      
      if (!roomCode) {
        throw new Error('Room creation returned null');
      }
      
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
      console.log('[Collaboration] Updating URL to:', newUrl);
      window.history.pushState({}, '', newUrl);

      return roomCode;
    } catch (error) {
      console.error('[Collaboration] Failed to create room (attempt', retryCount + 1, '):', error);
      
      // Retry up to 2 times with delay
      if (retryCount < 2) {
        console.log('[Collaboration] Retrying room creation in 2 seconds...');
        setState(prev => ({ 
          ...prev, 
          connectionError: `Connection failed, retrying... (${retryCount + 1}/3)` 
        }));
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        return createRoom(username, retryCount + 1);
      }
      
      // Final failure - provide helpful error message
      let errorMessage = 'Failed to create collaboration room';
      if (error instanceof Error) {
        if (error.message.includes('broker server')) {
          errorMessage = 'Cannot connect to PeerJS server. Try refreshing the page or check your internet connection.';
        } else if (error.message.includes('timed out')) {
          errorMessage = 'Connection timed out. Your network may be blocking WebRTC connections.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setState(prev => ({ 
        ...prev, 
        isJoining: false,
        connectionError: `${errorMessage} You can still use the Share dialog to create rooms manually.`
      }));
      return null;
    }
  }, [strategy, rtcManager]);

  // Join an existing collaboration room
  const joinRoom = useCallback(async (roomCode: string, username: string = 'Guest'): Promise<boolean> => {
    if (!strategy) {
      console.error('[Collaboration] No strategy selected for room join');
      setState(prev => ({ ...prev, connectionError: 'No strategy selected' }));
      return false;
    }

    try {
      console.log('[Collaboration] Joining room:', roomCode, 'with strategy:', strategy.id, 'username:', username);
      setState(prev => ({ ...prev, isJoining: true, connectionError: null }));
      
      const success = await rtcManager.joinRoom(roomCode, strategy.id, username);
      console.log('[Collaboration] Join room result:', success);
      
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
        console.log('[Collaboration] Updating URL to:', newUrl);
        window.history.pushState({}, '', newUrl);

        return true;
      } else {
        console.warn('[Collaboration] Failed to join room:', roomCode);
        setState(prev => ({ 
          ...prev, 
          isJoining: false,
          connectionError: 'Failed to join room' 
        }));
        return false;
      }
    } catch (error) {
      console.error('[Collaboration] Exception during room join:', error);
      setState(prev => ({ 
        ...prev, 
        isJoining: false,
        connectionError: 'Failed to join collaboration room' 
      }));
      return false;
    }
  }, [strategy, rtcManager]);

  // Leave collaboration room
  const leaveRoom = useCallback(async () => {
    await rtcManager.leaveRoom();
    
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

    rtcManager.sendMessage({
      type,
      payload: {
        ...payload,
        author: state.username,
        timestamp: new Date(),
      },
      timestamp: new Date(),
      author: state.username,
      messageId: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
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
    console.log('[Collaboration] Broadcasting task_create:', {
      taskId: task.id,
      taskName: task.name,
      author: state.username
    });
    broadcastChange('task_create', { task });
  }, [broadcastChange, state.username]);

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

  // Set username and broadcast the change
  const setUsername = useCallback((username: string) => {
    setState(prev => ({ ...prev, username }));
    
    // Broadcast username change to peers
    if (state.isConnected) {
      rtcManager.sendMessage({
        type: 'username_update',
        payload: {
          peerId: rtcManager.getPeerId(),
          username,
        },
        timestamp: new Date(),
        author: username,
        messageId: `username-${Date.now()}`,
      });
    }
  }, [state.isConnected]);

  // Clear connection error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, connectionError: null }));
  }, []);

  // Register message listener for specific message types
  const onMessage = useCallback((
    messageTypes: CollaborationMessage['type'][],
    callback: (message: CollaborationMessage) => void
  ): (() => void) => {
    const handler = (message: CollaborationMessage) => {
      if (messageTypes.includes(message.type)) {
        callback(message);
      }
    };
    
    return rtcManager.onMessage(handler);
  }, []);

  // Send a raw message (for chat, etc.)
  const sendMessage = useCallback((message: Omit<CollaborationMessage, 'messageId'>) => {
    if (!state.isConnected) return;
    
    rtcManager.sendMessage({
      ...message,
      messageId: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    });
  }, [state.isConnected]);

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
    
    // Messaging
    onMessage,
    sendMessage,
    
    // Conflict Resolution
    conflictResolution,
    peerId,
    
    // Animation helpers
    isRecentlyUpdated,
    recentUpdates: state.recentUpdates,
    
    // Peer information
    peerUsernames: state.peerUsernames,
  };
};