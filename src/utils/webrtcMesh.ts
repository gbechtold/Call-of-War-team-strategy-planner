import { dbManager } from './indexedDB';
import Peer from 'peerjs';
import type { DataConnection } from 'peerjs';

export interface PeerInfo {
  peerId: string;
  username: string;
  joinedAt: Date;
}

export interface CollaborationMessage {
  type: 'strategy_update' | 'task_update' | 'task_create' | 'task_delete' | 
        'user_cursor' | 'sync_request' | 'ping' | 'user_joined' | 'user_left' | 
        'chat_message' | 'username_update' | 'peer_list' | 'sync_state';
  payload: any;
  timestamp: Date;
  author: string;
  messageId: string;
}

export interface RoomState {
  roomCode: string;
  peers: PeerInfo[];
  strategyId: string;
  lastSyncTime: Date;
}

/**
 * Mesh network implementation for P2P collaboration
 * Each peer connects to all other peers for redundancy
 */
class WebRTCMeshManager {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private roomCode: string | null = null;
  private username: string = 'User';
  private roomPeers: Map<string, PeerInfo> = new Map();
  private messageQueue: CollaborationMessage[] = [];
  private connectionCallbacks: ((connected: boolean) => void)[] = [];
  private messageCallbacks: ((message: CollaborationMessage) => void)[] = [];
  private peerCountCallbacks: ((count: number) => void)[] = [];
  private processedMessages = new Set<string>();

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
        this.roomPeers.delete(peerId);
        this.notifyPeerCountCallbacks();
      }
    });
  }

  // Create a room (for compatibility with webrtcManager interface)
  async createRoom(strategyId: string, username: string = 'Host'): Promise<string | null> {
    // Generate a 6-character room code
    const roomCode = Array.from({ length: 6 }, () => 
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]
    ).join('');
    
    console.log('[WebRTC Mesh] Creating new room with code:', roomCode);
    const success = await this.createNewRoom(roomCode, strategyId, username);
    return success ? roomCode : null;
  }

  // Create a completely new room without trying to discover existing peers
  async createNewRoom(roomCode: string, strategyId: string, username: string = 'Host'): Promise<boolean> {
    try {
      this.roomCode = roomCode;
      this.username = username;
      
      // Generate a unique peer ID for this user
      const peerId = `${roomCode}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
      
      this.peer = new Peer(peerId, {
        debug: 2,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ]
        }
      });

      return new Promise((resolve) => {
        if (!this.peer) {
          resolve(false);
          return;
        }

        this.peer.on('open', async (id) => {
          console.log('[WebRTC Mesh] New room peer opened with ID:', id);
          
          // Add self to room peers
          this.roomPeers.set(id, {
            peerId: id,
            username,
            joinedAt: new Date()
          });
          
          // Save room state
          await this.saveRoomState(strategyId);
          
          // Set up listeners for incoming connections (but don't try to connect to existing peers)
          this.setupPeerListeners();
          
          this.notifyConnectionCallbacks(true);
          this.notifyPeerCountCallbacks();
          console.log('[WebRTC Mesh] New room created successfully');
          resolve(true);
        });

        this.peer.on('error', (error) => {
          console.error('[WebRTC Mesh] New room creation error:', error);
          resolve(false);
        });

        // Shorter timeout for room creation (3 seconds)
        setTimeout(() => {
          console.log('[WebRTC Mesh] New room creation proceeding after timeout');
          resolve(true);
        }, 3000);
      });
    } catch (error) {
      console.error('[WebRTC Mesh] Failed to create new room:', error);
      return false;
    }
  }

  // Join a room (for compatibility with webrtcManager interface)
  async joinRoom(roomCode: string, strategyId: string, username: string = 'Guest'): Promise<boolean> {
    return await this.joinOrCreateRoom(roomCode, strategyId, username);
  }

  // Create or join a room
  async joinOrCreateRoom(roomCode: string, strategyId: string, username: string = 'User'): Promise<boolean> {
    try {
      this.roomCode = roomCode;
      this.username = username;
      
      // Generate a unique peer ID for this user
      const peerId = `${roomCode}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
      
      this.peer = new Peer(peerId, {
        debug: 2,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ]
        }
      });

      return new Promise((resolve) => {
        if (!this.peer) {
          resolve(false);
          return;
        }

        this.peer.on('open', async (id) => {
          console.log('Peer opened with ID:', id);
          
          // Add self to room peers
          this.roomPeers.set(id, {
            peerId: id,
            username,
            joinedAt: new Date()
          });
          
          // Save room state
          await this.saveRoomState(strategyId);
          
          // Try to connect to existing peers in the room
          const existingPeers = await this.discoverPeers(roomCode);
          
          if (existingPeers.length > 0) {
            // Join existing room
            console.log('Found existing peers:', existingPeers);
            await this.connectToPeers(existingPeers);
          } else {
            // Create new room
            console.log('Creating new room');
          }
          
          // Set up listeners for incoming connections
          this.setupPeerListeners();
          
          this.notifyConnectionCallbacks(true);
          this.notifyPeerCountCallbacks();
          resolve(true);
        });

        this.peer.on('error', (error) => {
          console.error('Peer error:', error);
          resolve(false);
        });

        // Timeout after 10 seconds
        setTimeout(() => {
          if (this.connections.size === 0 && this.roomPeers.size <= 1) {
            console.log('Connection timeout, proceeding anyway');
            resolve(true);
          }
        }, 10000);
      });
    } catch (error) {
      console.error('Failed to join/create room:', error);
      return false;
    }
  }

  // Discover existing peers in a room
  private async discoverPeers(roomCode: string): Promise<string[]> {
    // Try to connect to the "host" peer first
    // This is a known peer ID pattern for backward compatibility
    const hostPeerId = `${roomCode}-host`;
    const potentialPeers: string[] = [hostPeerId];
    
    // Also try to find any existing peers from IndexedDB
    try {
      const sessions = await dbManager.getAllP2PSessions();
      const roomSession = sessions.find(s => s.roomCode === roomCode);
      if (roomSession && roomSession.participants) {
        roomSession.participants.forEach(p => {
          if (p.id !== this.peer?.id && !potentialPeers.includes(p.id)) {
            potentialPeers.push(p.id);
          }
        });
      }
    } catch (error) {
      console.error('Failed to discover peers from DB:', error);
    }
    
    return potentialPeers;
  }

  // Connect to a list of peers
  private async connectToPeers(peerIds: string[]): Promise<void> {
    const connectionPromises = peerIds.map(peerId => this.connectToPeer(peerId));
    await Promise.allSettled(connectionPromises);
  }

  // Connect to a specific peer
  private async connectToPeer(peerId: string): Promise<boolean> {
    if (!this.peer || this.connections.has(peerId)) {
      return false;
    }

    return new Promise((resolve) => {
      console.log('Attempting to connect to peer:', peerId);
      
      const conn = this.peer!.connect(peerId, {
        label: 'strategy-sync',
        serialization: 'json',
        reliable: true
      });

      const timeout = setTimeout(() => {
        console.log('Connection timeout for peer:', peerId);
        resolve(false);
      }, 5000);

      conn.on('open', () => {
        clearTimeout(timeout);
        console.log('Connected to peer:', peerId);
        this.connections.set(peerId, conn);
        this.setupConnectionHandlers(conn);
        
        // Send our peer info
        this.sendMessage({
          type: 'user_joined',
          payload: { 
            username: this.username,
            peerId: this.peer!.id,
            peerList: Array.from(this.roomPeers.values())
          },
          timestamp: new Date(),
          author: this.username,
          messageId: this.generateMessageId()
        });
        
        resolve(true);
      });

      conn.on('error', (error) => {
        clearTimeout(timeout);
        console.error('Connection error:', error);
        resolve(false);
      });
    });
  }

  private setupPeerListeners() {
    if (!this.peer) return;

    this.peer.on('connection', (conn) => {
      console.log('New peer connection:', conn.peer);
      
      conn.on('open', () => {
        this.connections.set(conn.peer, conn);
        this.setupConnectionHandlers(conn);
        this.notifyPeerCountCallbacks();
        
        // Send current peer list to new peer
        this.sendToPeer(conn.peer, {
          type: 'peer_list',
          payload: {
            peers: Array.from(this.roomPeers.values())
          },
          timestamp: new Date(),
          author: this.username,
          messageId: this.generateMessageId()
        });
      });
    });
  }

  private setupConnectionHandlers(conn: DataConnection) {
    conn.on('data', (data) => {
      try {
        const message = data as CollaborationMessage;
        
        // Prevent duplicate message processing
        if (this.processedMessages.has(message.messageId)) {
          console.log('Skipping duplicate message:', message.messageId);
          return;
        }
        this.processedMessages.add(message.messageId);
        
        // Clean up old message IDs
        if (this.processedMessages.size > 1000) {
          const oldestIds = Array.from(this.processedMessages).slice(0, 500);
          oldestIds.forEach(id => this.processedMessages.delete(id));
        }
        
        console.log('Received message:', message.type, 'from', conn.peer, 'messageId:', message.messageId);
        
        // Handle special message types
        if (message.type === 'user_joined') {
          const { peerId, username } = message.payload;
          if (peerId) {
            this.roomPeers.set(peerId, { peerId, username, joinedAt: new Date() });
          }
          
          // Connect to peers we don't know about
          if (message.payload.peerList) {
            message.payload.peerList.forEach((peer: PeerInfo) => {
              if (!this.roomPeers.has(peer.peerId) && peer.peerId !== this.peer?.id && !this.connections.has(peer.peerId)) {
                this.roomPeers.set(peer.peerId, peer);
                this.connectToPeer(peer.peerId);
              }
            });
          }
        } else if (message.type === 'peer_list') {
          // Update our peer list
          message.payload.peers.forEach((peer: PeerInfo) => {
            if (!this.roomPeers.has(peer.peerId) && peer.peerId !== this.peer?.id && !this.connections.has(peer.peerId)) {
              this.roomPeers.set(peer.peerId, peer);
              this.connectToPeer(peer.peerId);
            }
          });
        } else if (message.type === 'username_update') {
          const { peerId, username } = message.payload;
          const peer = this.roomPeers.get(peerId);
          if (peer) {
            peer.username = username;
          }
        }
        
        // Always notify listeners for all messages
        this.notifyMessageCallbacks(message);
        
        // Forward message to other peers (mesh network) - but not for certain types
        if (!['peer_list', 'sync_state'].includes(message.type)) {
          this.forwardMessage(message, conn.peer);
        }
        
        this.notifyPeerCountCallbacks();
      } catch (error) {
        console.error('Failed to process message:', error);
      }
    });

    conn.on('close', () => {
      console.log('Peer disconnected:', conn.peer);
      this.connections.delete(conn.peer);
      this.roomPeers.delete(conn.peer);
      this.notifyPeerCountCallbacks();
      
      // Notify about user leaving
      this.sendMessage({
        type: 'user_left',
        payload: { 
          peerId: conn.peer,
          username: this.roomPeers.get(conn.peer)?.username || 'Unknown'
        },
        timestamp: new Date(),
        author: this.username,
        messageId: this.generateMessageId()
      });
    });

    conn.on('error', (error) => {
      console.error('Connection error:', error);
      this.connections.delete(conn.peer);
      this.notifyPeerCountCallbacks();
    });
  }

  // Forward message to all peers except the sender
  private forwardMessage(message: CollaborationMessage, senderPeerId: string) {
    this.connections.forEach((conn, peerId) => {
      if (conn.open && peerId !== senderPeerId) {
        try {
          conn.send(message);
        } catch (error) {
          console.error(`Failed to forward message to ${peerId}:`, error);
        }
      }
    });
  }

  // Send message to all connected peers
  sendMessage(message: CollaborationMessage): void {
    console.log('Sending message:', message.type, 'to', this.connections.size, 'peers');
    
    // Add to processed messages to prevent echo
    this.processedMessages.add(message.messageId);
    
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

  // Send message to specific peer
  private sendToPeer(peerId: string, message: CollaborationMessage) {
    const conn = this.connections.get(peerId);
    if (conn && conn.open) {
      try {
        conn.send(message);
      } catch (error) {
        console.error(`Failed to send message to ${peerId}:`, error);
      }
    }
  }

  // Get current room link
  getRoomLink(): string | null {
    if (!this.roomCode) return null;
    return `${window.location.origin}${window.location.pathname}#room=${this.roomCode}`;
  }

  // Leave the current room
  async leaveRoom(): Promise<void> {
    if (this.peer) {
      // Notify peers we're leaving
      this.sendMessage({
        type: 'user_left',
        payload: { 
          peerId: this.peer.id,
          username: this.username
        },
        timestamp: new Date(),
        author: this.username,
        messageId: this.generateMessageId()
      });
      
      this.connections.forEach(conn => conn.close());
      this.connections.clear();
      this.roomPeers.clear();
      this.peer.destroy();
      this.peer = null;
    }

    this.roomCode = null;
    this.processedMessages.clear();
    this.notifyConnectionCallbacks(false);
    this.notifyPeerCountCallbacks();
  }

  // Helper methods
  isConnected(): boolean {
    // We're connected if we have a peer and room code, even without other connections
    return this.peer !== null && !this.peer.destroyed && this.roomCode !== null;
  }

  getConnectedPeers(): number {
    return this.connections.size;
  }

  getPeerId(): string | null {
    return this.peer?.id || null;
  }

  getRoomCode(): string | null {
    return this.roomCode;
  }

  getUsername(): string {
    return this.username;
  }


  private generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  private async saveRoomState(strategyId: string) {
    if (!this.roomCode || !this.peer) return;

    try {
      await dbManager.saveP2PSession({
        roomCode: this.roomCode,
        strategyId,
        hostId: this.peer.id,
        createdAt: new Date(),
        lastActive: new Date(),
        participants: Array.from(this.roomPeers.values()).map(p => ({
          id: p.peerId,
          username: p.username,
          isHost: false,
          joinedAt: p.joinedAt
        }))
      });
    } catch (error) {
      console.error('Failed to save room state:', error);
    }
  }

  // Event handlers
  onConnectionChange(callback: (connected: boolean) => void): void {
    this.connectionCallbacks.push(callback);
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

// Export singleton instance
export const webrtcMeshManager = new WebRTCMeshManager();