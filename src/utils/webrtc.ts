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
  type: 'strategy_update' | 'task_update' | 'task_create' | 'task_delete' | 'user_cursor' | 'sync_request' | 'ping' | 'user_joined' | 'user_left' | 'chat_message' | 'username_update' | 'peer_list' | 'sync_state';
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

  // Create a new room (host) - simplified approach with working fallback
  async createRoom(strategyId: string, username: string = 'Host'): Promise<string | null> {
    const roomCode = this.generateRoomCode();
    const hostPeerId = `${roomCode}-host`;
    
    // Try servers in sequence - including more reliable alternatives
    const servers = [
      { name: 'Default PeerJS', config: { debug: 1 } },
      { 
        name: 'PeerJS Cloud Service', 
        config: {
          host: 'peer-server.cloud',
          port: 443,
          path: '/peerjs',
          secure: true,
          debug: 1
        }
      },
      {
        name: 'Alternative Server 1',
        config: {
          host: 'peerjs-server.herokuapp.com',
          port: 443,
          path: '/peerjs',
          secure: true,
          debug: 1
        }
      },
      {
        name: 'Alternative Server 2',
        config: {
          host: 'peerjs.net',
          port: 443,
          path: '/',
          secure: true,
          debug: 1
        }
      },
      {
        name: 'Localhost Fallback (Dev)',
        config: {
          host: 'localhost',
          port: 9000,
          path: '/myapp',
          secure: false,
          debug: 1
        }
      }
    ];
    
    for (let i = 0; i < servers.length; i++) {
      console.log(`[WebRTC] Trying ${servers[i].name} (${i + 1}/${servers.length})`);
      
      try {
        const result = await this.tryCreateWithServer(hostPeerId, roomCode, strategyId, username, servers[i].config);
        if (result) {
          console.log(`[WebRTC] Success with ${servers[i].name}`);
          return result;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.log(`[WebRTC] ${servers[i].name} failed:`, errorMsg);
        // Clean up failed peer
        if (this.peer) {
          this.peer.destroy();
          this.peer = null;
        }
        // Continue to next server
      }
    }
    
    console.error('[WebRTC] All servers failed - PeerJS infrastructure may be down');
    
    // As a last resort, try to create a room with minimal config and longer timeout
    console.log('[WebRTC] Attempting emergency fallback with basic config...');
    try {
      const result = await this.tryCreateWithBasicConfig(hostPeerId, roomCode, strategyId, username);
      if (result) {
        console.log('[WebRTC] Emergency fallback succeeded!');
        return result;
      }
    } catch (error) {
      console.log('[WebRTC] Emergency fallback also failed');
    }
    
    return null;
  }
  
  // Try creating room with a specific server config
  private async tryCreateWithServer(
    hostPeerId: string,
    roomCode: string,
    strategyId: string,
    username: string,
    config: any
  ): Promise<string | null> {
    return new Promise((resolve, reject) => {
      try {
        this.peer = new Peer(hostPeerId, config);

        if (!this.peer) {
          reject(new Error('Failed to create peer'));
          return;
        }

        let resolved = false;
        
        this.peer.on('open', (id) => {
          console.log('Host peer opened with ID:', id);
          if (resolved) return;
          resolved = true;
          
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
          if (resolved) return;
          resolved = true;
          
          // Provide more specific error message
          let errorMessage = 'Failed to create room';
          if (error.message?.includes('Could not connect to broker server')) {
            errorMessage = 'Connection to PeerJS server failed. Please check your internet connection.';
          } else if (error.message?.includes('ID taken')) {
            errorMessage = 'Room code already in use. Please try again.';
          }
          
          reject(new Error(errorMessage));
        });

        // Shorter timeout for server attempts (5 seconds each)
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            console.log('Server timed out, trying next...');
            reject(new Error('Server timed out'));
          }
        }, 5000);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Emergency fallback with minimal configuration
  private async tryCreateWithBasicConfig(
    hostPeerId: string,
    roomCode: string,
    strategyId: string,
    username: string
  ): Promise<string | null> {
    return new Promise((resolve, reject) => {
      try {
        // Try with minimal config and no custom server
        this.peer = new Peer(hostPeerId, {
          debug: 0, // Disable debug to reduce potential conflicts
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' }
            ]
          }
        });

        if (!this.peer) {
          reject(new Error('Failed to create emergency peer'));
          return;
        }

        let resolved = false;
        
        this.peer.on('open', (id) => {
          console.log('[Emergency] Peer opened with ID:', id);
          if (resolved) return;
          resolved = true;
          
          this.isHost = true;
          this.roomCode = roomCode;
          this.username = username;
          
          this.saveRoomState(strategyId);
          this.setupHostListeners();
          this.notifyConnectionCallbacks(true);
          resolve(roomCode);
        });

        this.peer.on('error', (error) => {
          console.error('[Emergency] Peer error:', error);
          if (resolved) return;
          resolved = true;
          reject(new Error('Emergency fallback failed'));
        });

        // Longer timeout for emergency fallback (15 seconds)
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            console.log('[Emergency] Timeout reached');
            reject(new Error('Emergency fallback timed out'));
          }
        }, 15000);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Join an existing room
  async joinRoom(roomCode: string, strategyId: string, username: string = 'Guest'): Promise<boolean> {
    try {
      // Generate a unique peer ID for this guest
      const guestPeerId = `${roomCode}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
      
      // Use same server selection logic as host
      const peerOptions = {
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun.cloudflare.com:3478' },
            { urls: 'stun:stun.stunprotocol.org:3478' },
          ]
        }
      };
      
      try {
        this.peer = new Peer(guestPeerId, peerOptions);
      } catch (error) {
        console.log('Main PeerJS server failed, trying alternative...');
        this.peer = new Peer(guestPeerId, {
          ...peerOptions,
          host: 'peerjs-server.herokuapp.com',
          port: 443,
          path: '/'
        });
      }

      return new Promise((resolve, reject) => {
        if (!this.peer) {
          reject('Failed to create peer');
          return;
        }

        let resolved = false;
        
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
            if (resolved) return;
            resolved = true;
            
            this.connections.set(hostPeerId, conn);
            this.saveRoomState(strategyId);
            this.notifyConnectionCallbacks(true);
            this.notifyPeerCountCallbacks();
            
            // Send join message
            this.sendMessage({
              type: 'user_joined',
              payload: { username, peerId: guestPeerId },
              timestamp: new Date(),
              author: username,
              messageId: this.generateMessageId()
            });
            
            resolve(true);
          });

          conn.on('error', (error) => {
            console.error('Connection to host failed:', error);
            if (resolved) return;
            resolved = true;
            resolve(false);
          });
        });

        this.peer.on('error', (error) => {
          console.error('Guest peer error:', error);
          if (resolved) return;
          resolved = true;
          resolve(false);
        });

        // Timeout after 10 seconds
        setTimeout(() => {
          if (!resolved) {
            console.log('Join room timed out');
            resolved = true;
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
        console.log('Received message:', message.type, 'from', conn.peer, 'data:', message);
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
        payload: { 
          username,
          peerId: conn.peer
        },
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
    console.log('Sending message:', message.type, 'to', this.connections.size, 'peers');
    
    if (this.connections.size === 0) {
      console.log('No peers connected, queueing message');
      this.messageQueue.push(message);
      return;
    }

    let sentCount = 0;
    this.connections.forEach((conn, peerId) => {
      if (conn.open) {
        try {
          conn.send(message);
          sentCount++;
          console.log(`Sent message to peer ${peerId}`);
        } catch (error) {
          console.error(`Failed to send message to ${peerId}:`, error);
        }
      } else {
        console.log(`Connection to ${peerId} is not open`);
      }
    });
    
    console.log(`Message sent to ${sentCount} peers`);
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

  // Get current peer ID
  getPeerId(): string | null {
    return this.peer?.id || null;
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

  // Event handlers - return unsubscribe functions
  onConnectionChange(callback: (connected: boolean) => void): () => void {
    this.connectionCallbacks.push(callback);
    return () => {
      const index = this.connectionCallbacks.indexOf(callback);
      if (index > -1) {
        this.connectionCallbacks.splice(index, 1);
      }
    };
  }

  onMessage(callback: (message: CollaborationMessage) => void): () => void {
    this.messageCallbacks.push(callback);
    return () => {
      const index = this.messageCallbacks.indexOf(callback);
      if (index > -1) {
        this.messageCallbacks.splice(index, 1);
      }
    };
  }

  onPeerCountChange(callback: (count: number) => void): () => void {
    this.peerCountCallbacks.push(callback);
    return () => {
      const index = this.peerCountCallbacks.indexOf(callback);
      if (index > -1) {
        this.peerCountCallbacks.splice(index, 1);
      }
    };
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