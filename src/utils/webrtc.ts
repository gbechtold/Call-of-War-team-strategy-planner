import { dbManager } from './indexedDB';
import Peer from 'peerjs';
import type { DataConnection } from 'peerjs';

export interface PeerConnection {
  id: string;
  peerId: string;
  username: string;
  isHost: boolean;
  lastSeen: Date;
}

export interface CollaborationMessage {
  type: 'strategy_update' | 'task_update' | 'task_create' | 'task_delete' | 'user_cursor' | 'sync_request' | 'ping' | 'user_joined' | 'user_left' | 'chat_message';
  payload: any;
  timestamp: Date;
  author: string;
  messageId: string;
}

export interface RoomState {
  roomCode: string;
  isHost: boolean;
  peers: PeerConnection[];
  strategyId: string;
  lastSyncTime: Date;
}

class WebRTCManager {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private roomCode: string | null = null;
  private isHost: boolean = false;
  private username: string = 'User';
  private messageQueue: CollaborationMessage[] = [];
  private connectionCallbacks: ((connected: boolean) => void)[] = [];
  private messageCallbacks: ((message: CollaborationMessage) => void)[] = [];
  private peerCountCallbacks: ((count: number) => void)[] = [];

  constructor() {
    this.setupConnectionMonitoring();
  }

  private setupConnectionMonitoring() {
    // Clean up dead connections every 30 seconds
    setInterval(() => {
      this.cleanupDeadConnections();
    }, 30000);
  }

  private cleanupDeadConnections() {
    this.connections.forEach((conn, peerId) => {
      if (!conn.open) {
        console.log(`Removing dead connection: ${peerId}`);
        this.connections.delete(peerId);
        this.notifyPeerCountCallbacks();
      }
    });
  }

  // Create a new room (host)
  async createRoom(strategyId: string, username: string = 'Host'): Promise<string | null> {
    try {
      // Generate a 6-character room code
      const roomCode = this.generateRoomCode();
      
      // Initialize PeerJS with a predictable ID based on room code
      const hostPeerId = `${roomCode}-host`;
      
      this.peer = new Peer(hostPeerId, {
        debug: 2, // Enable debug logs
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ]
        }
      });

      return new Promise((resolve, reject) => {
        if (!this.peer) {
          reject('Failed to create peer');
          return;
        }

        this.peer.on('open', (id) => {
          console.log('Host peer opened with ID:', id);
          this.isHost = true;
          this.roomCode = roomCode;
          this.username = username;
          
          // Save room state
          this.saveRoomState(strategyId);
          
          // Listen for incoming connections
          this.setupHostListeners();
          
          this.notifyConnectionCallbacks(true);
          resolve(roomCode);
        });

        this.peer.on('error', (error) => {
          console.error('Host peer error:', error);
          reject(error);
        });

        // Timeout after 10 seconds
        setTimeout(() => {
          if (!this.roomCode) {
            reject('Room creation timed out');
          }
        }, 10000);
      });
    } catch (error) {
      console.error('Failed to create room:', error);
      return null;
    }
  }

  // Join an existing room
  async joinRoom(roomCode: string, strategyId: string, username: string = 'Guest'): Promise<boolean> {
    try {
      // Generate a unique peer ID for this guest
      const guestPeerId = `${roomCode}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
      
      this.peer = new Peer(guestPeerId, {
        debug: 2,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ]
        }
      });

      return new Promise((resolve, reject) => {
        if (!this.peer) {
          reject('Failed to create peer');
          return;
        }

        this.peer.on('open', (id) => {
          console.log('Guest peer opened with ID:', id);
          this.isHost = false;
          this.roomCode = roomCode;
          this.username = username;
          
          // Connect to host
          const hostPeerId = `${roomCode}-host`;
          console.log('Attempting to connect to host:', hostPeerId);
          
          const conn = this.peer!.connect(hostPeerId, {
            label: 'strategy-sync',
            serialization: 'json'
          });

          this.setupConnectionHandlers(conn, username);

          conn.on('open', () => {
            console.log('Connected to host successfully');
            this.connections.set(hostPeerId, conn);
            this.saveRoomState(strategyId);
            this.notifyConnectionCallbacks(true);
            this.notifyPeerCountCallbacks();
            
            // Send join message
            this.sendMessage({
              type: 'user_joined',
              payload: { username },
              timestamp: new Date(),
              author: username,
              messageId: this.generateMessageId()
            });
            
            resolve(true);
          });

          conn.on('error', (error) => {
            console.error('Connection to host failed:', error);
            resolve(false);
          });
        });

        this.peer.on('error', (error) => {
          console.error('Guest peer error:', error);
          resolve(false);
        });

        // Timeout after 10 seconds
        setTimeout(() => {
          if (this.connections.size === 0) {
            console.log('Join room timed out');
            resolve(false);
          }
        }, 10000);
      });
    } catch (error) {
      console.error('Failed to join room:', error);
      return false;
    }
  }

  private setupHostListeners() {
    if (!this.peer) return;

    this.peer.on('connection', (conn) => {
      console.log('New peer connected:', conn.peer);
      this.connections.set(conn.peer, conn);
      this.setupConnectionHandlers(conn, 'Guest');
      this.notifyPeerCountCallbacks();
    });
  }

  private setupConnectionHandlers(conn: DataConnection, username: string) {
    conn.on('data', (data) => {
      try {
        const message = data as CollaborationMessage;
        console.log('Received message:', message);
        this.notifyMessageCallbacks(message);
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    });

    conn.on('close', () => {
      console.log('Peer disconnected:', conn.peer);
      this.connections.delete(conn.peer);
      this.notifyPeerCountCallbacks();
      
      // Notify about user leaving
      this.sendMessage({
        type: 'user_left',
        payload: { username },
        timestamp: new Date(),
        author: username,
        messageId: this.generateMessageId()
      });
    });

    conn.on('error', (error) => {
      console.error('Connection error:', error);
      this.connections.delete(conn.peer);
      this.notifyPeerCountCallbacks();
    });
  }

  // Send message to all connected peers
  sendMessage(message: CollaborationMessage): void {
    if (this.connections.size === 0) {
      console.log('No peers connected, queueing message');
      this.messageQueue.push(message);
      return;
    }

    this.connections.forEach((conn, peerId) => {
      if (conn.open) {
        try {
          conn.send(message);
        } catch (error) {
          console.error(`Failed to send message to ${peerId}:`, error);
        }
      }
    });
  }

  // Get current room link
  getRoomLink(): string | null {
    if (!this.roomCode) return null;
    return `${window.location.origin}${window.location.pathname}#room=${this.roomCode}`;
  }

  // Leave the current room
  async leaveRoom(): Promise<void> {
    if (this.peer) {
      this.connections.forEach(conn => conn.close());
      this.connections.clear();
      this.peer.destroy();
      this.peer = null;
    }

    this.roomCode = null;
    this.isHost = false;
    this.notifyConnectionCallbacks(false);
    this.notifyPeerCountCallbacks();
  }

  // Check if currently connected
  isConnected(): boolean {
    return this.peer !== null && !this.peer.destroyed && this.connections.size > 0;
  }

  // Get number of connected peers
  getConnectedPeers(): number {
    return this.connections.size;
  }

  // Generate a 6-character room code
  private generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Generate unique message ID
  private generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  // Save room state to IndexedDB
  private async saveRoomState(strategyId: string) {
    if (!this.roomCode) return;

    try {
      await dbManager.saveP2PSession({
        roomCode: this.roomCode,
        strategyId,
        hostId: this.peer?.id || '',
        createdAt: new Date(),
        lastActive: new Date(),
        participants: [{
          id: this.peer?.id || '',
          username: this.username,
          isHost: this.isHost,
          joinedAt: new Date()
        }]
      });
    } catch (error) {
      console.error('Failed to save room state:', error);
    }
  }

  // Event handlers
  onConnectionChange(callback: (connected: boolean) => void): void {
    this.connectionCallbacks.push(callback);
  }

  onMessage(callback: (message: CollaborationMessage) => void): void {
    this.messageCallbacks.push(callback);
  }

  onPeerCountChange(callback: (count: number) => void): void {
    this.peerCountCallbacks.push(callback);
  }

  private notifyConnectionCallbacks(connected: boolean): void {
    this.connectionCallbacks.forEach(callback => callback(connected));
  }

  private notifyMessageCallbacks(message: CollaborationMessage): void {
    this.messageCallbacks.forEach(callback => callback(message));
  }

  private notifyPeerCountCallbacks(): void {
    const count = this.connections.size;
    this.peerCountCallbacks.forEach(callback => callback(count));
  }
}

// Helper function to extract room code from URL
export function extractRoomCodeFromUrl(): string | null {
  const hash = window.location.hash;
  const match = hash.match(/#room=([A-Z0-9]{6})/);
  return match ? match[1] : null;
}

// Export singleton instance
export const webrtcManager = new WebRTCManager();