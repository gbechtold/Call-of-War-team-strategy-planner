import { dbManager } from './indexedDB';

export interface PeerConnection {
  id: string;
  peerId: string;
  username: string;
  isHost: boolean;
  lastSeen: Date;
}

export interface CollaborationMessage {
  type: 'strategy_update' | 'task_update' | 'task_create' | 'task_delete' | 'user_cursor' | 'sync_request' | 'ping' | 'user_joined' | 'user_left';
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
  private peer: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private roomCode: string | null = null;
  private isHost: boolean = false;
  private peers: Map<string, RTCPeerConnection> = new Map();
  private messageQueue: CollaborationMessage[] = [];
  private connectionCallbacks: ((connected: boolean) => void)[] = [];
  private messageCallbacks: ((message: CollaborationMessage) => void)[] = [];

  // STUN servers for NAT traversal
  private readonly rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
    ],
  };

  constructor() {
    this.setupConnectionMonitoring();
  }

  private setupConnectionMonitoring() {
    // Monitor connection state changes
    setInterval(() => {
      this.checkConnectionStates();
    }, 5000);
  }

  private checkConnectionStates() {
    this.peers.forEach((connection, peerId) => {
      if (connection.connectionState === 'disconnected' || connection.connectionState === 'failed') {
        console.log(`Peer ${peerId} disconnected`);
        this.removePeer(peerId);
      }
    });
  }

  // Create a new room (host)
  async createRoom(strategyId: string, username: string = 'Host'): Promise<string> {
    this.roomCode = this.generateRoomCode();
    this.isHost = true;

    // Save room state to IndexedDB
    await dbManager.saveP2PSession({
      roomCode: this.roomCode,
      strategyId,
      hostId: 'local',
      createdAt: new Date(),
      lastActive: new Date(),
      participants: [{ id: 'local', username, isHost: true, joinedAt: new Date() }],
    });

    console.log(`Created room: ${this.roomCode}`);
    return this.roomCode;
  }

  // Join an existing room
  async joinRoom(roomCode: string, _strategyId: string, username: string = 'Guest'): Promise<boolean> {
    this.roomCode = roomCode;
    this.isHost = false;

    try {
      // For now, we'll use a simple signaling mechanism via URL hash
      // In a real implementation, this would connect to a signaling server
      console.log(`Attempting to join room: ${roomCode}`);
      
      // Set up peer connection
      await this.setupPeerConnection(username);
      
      return true;
    } catch (error) {
      console.error('Failed to join room:', error);
      return false;
    }
  }

  private async setupPeerConnection(_username: string): Promise<void> {
    this.peer = new RTCPeerConnection(this.rtcConfig);

    // Set up data channel for strategy synchronization
    if (this.isHost) {
      this.dataChannel = this.peer.createDataChannel('strategy', {
        ordered: true,
      });
      this.setupDataChannelHandlers(this.dataChannel);
    } else {
      this.peer.ondatachannel = (event) => {
        this.dataChannel = event.channel;
        this.setupDataChannelHandlers(this.dataChannel);
      };
    }

    // Handle ICE candidates
    this.peer.onicecandidate = (event) => {
      if (event.candidate) {
        // In a real implementation, send this to signaling server
        console.log('ICE candidate:', event.candidate);
      }
    };

    // Handle connection state changes
    this.peer.onconnectionstatechange = () => {
      console.log('Connection state:', this.peer?.connectionState);
      const isConnected = this.peer?.connectionState === 'connected';
      this.notifyConnectionCallbacks(isConnected);
    };
  }

  private setupDataChannelHandlers(channel: RTCDataChannel) {
    channel.onopen = () => {
      console.log('Data channel opened');
      // Send initial sync request
      this.sendMessage({
        type: 'sync_request',
        payload: { requestId: this.generateMessageId() },
        timestamp: new Date(),
        author: 'local',
        messageId: this.generateMessageId(),
      });
    };

    channel.onmessage = (event) => {
      try {
        const message: CollaborationMessage = JSON.parse(event.data);
        this.handleIncomingMessage(message);
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    };

    channel.onclose = () => {
      console.log('Data channel closed');
      this.notifyConnectionCallbacks(false);
    };

    channel.onerror = (error) => {
      console.error('Data channel error:', error);
    };
  }

  private handleIncomingMessage(message: CollaborationMessage) {
    console.log('Received message:', message);
    
    // Process message based on type
    switch (message.type) {
      case 'strategy_update':
      case 'task_update':
      case 'task_create':
      case 'task_delete':
        // Forward to message callbacks for processing
        this.notifyMessageCallbacks(message);
        break;
      
      case 'sync_request':
        // Send current strategy state
        this.handleSyncRequest(message);
        break;
      
      case 'ping':
        // Respond with pong
        this.sendMessage({
          type: 'ping',
          payload: { response: true },
          timestamp: new Date(),
          author: 'local',
          messageId: this.generateMessageId(),
        });
        break;
      
      case 'user_joined':
      case 'user_left':
        console.log(`User ${message.payload.username} ${message.type.split('_')[1]}`);
        break;
    }
  }

  private async handleSyncRequest(message: CollaborationMessage) {
    // Send current strategy state to requesting peer
    // This would be implemented to send the current strategy data
    console.log('Handling sync request from:', message.author);
  }

  // Send a message to all connected peers
  sendMessage(message: CollaborationMessage): void {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      // Queue message for later delivery
      this.messageQueue.push(message);
      return;
    }

    try {
      this.dataChannel.send(JSON.stringify(message));
    } catch (error) {
      console.error('Failed to send message:', error);
      this.messageQueue.push(message);
    }
  }


  // Broadcast strategy changes
  broadcastStrategyUpdate(type: CollaborationMessage['type'], payload: any): void {
    const message: CollaborationMessage = {
      type,
      payload,
      timestamp: new Date(),
      author: 'local',
      messageId: this.generateMessageId(),
    };

    this.sendMessage(message);
  }

  // Generate room code
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
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  // Remove disconnected peer
  private removePeer(peerId: string): void {
    const connection = this.peers.get(peerId);
    if (connection) {
      connection.close();
    }
    this.peers.delete(peerId);
  }

  // Connection event handlers
  onConnectionChange(callback: (connected: boolean) => void): void {
    this.connectionCallbacks.push(callback);
  }

  onMessage(callback: (message: CollaborationMessage) => void): void {
    this.messageCallbacks.push(callback);
  }

  private notifyConnectionCallbacks(connected: boolean): void {
    this.connectionCallbacks.forEach(callback => callback(connected));
  }

  private notifyMessageCallbacks(message: CollaborationMessage): void {
    this.messageCallbacks.forEach(callback => callback(message));
  }

  // Get current room state
  getRoomState(): RoomState | null {
    if (!this.roomCode) return null;

    return {
      roomCode: this.roomCode,
      isHost: this.isHost,
      peers: Array.from(this.peers.entries()).map(([id, _connection]) => ({
        id,
        peerId: id,
        username: 'Unknown', // Would be tracked in real implementation
        isHost: false,
        lastSeen: new Date(),
      })),
      strategyId: '', // Would be tracked
      lastSyncTime: new Date(),
    };
  }

  // Disconnect from room
  async disconnect(): Promise<void> {
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    if (this.peer) {
      this.peer.close();
      this.peer = null;
    }

    this.peers.forEach(connection => connection.close());
    this.peers.clear();

    this.roomCode = null;
    this.isHost = false;
    this.messageQueue = [];

    console.log('Disconnected from collaboration session');
  }

  // Check if currently connected
  isConnected(): boolean {
    return this.dataChannel?.readyState === 'open' || false;
  }

  // Get current room code
  getCurrentRoomCode(): string | null {
    return this.roomCode;
  }
}

// Singleton instance
export const webrtcManager = new WebRTCManager();

// Helper function to generate shareable room links
export const generateRoomLink = (roomCode: string): string => {
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}#room=${roomCode}`;
};

// Helper function to extract room code from URL
export const extractRoomCodeFromUrl = (): string | null => {
  const hash = window.location.hash;
  const match = hash.match(/room=([A-Z0-9]{6})/);
  return match ? match[1] : null;
};