export const COLLABORATION_CONFIG = {
  // Enable mesh networking for better resilience when host leaves
  // When true, uses a fully connected mesh network where all peers connect to each other
  // When false, uses a star topology where all peers connect through the host
  USE_MESH_NETWORKING: false,
  
  // Maximum number of peers in a room (to prevent performance issues)
  MAX_PEERS_PER_ROOM: 10,
  
  // Connection timeout in milliseconds
  CONNECTION_TIMEOUT: 30000,
  
  // Ping interval to keep connections alive
  PING_INTERVAL: 15000,
  
  // Message queue size for offline message handling
  MESSAGE_QUEUE_SIZE: 100,
  
  // Enable connection persistence (reconnect on disconnect)
  ENABLE_RECONNECT: true,
  
  // Maximum reconnection attempts
  MAX_RECONNECT_ATTEMPTS: 5,
  
  // Reconnection delay in milliseconds
  RECONNECT_DELAY: 2000,
};