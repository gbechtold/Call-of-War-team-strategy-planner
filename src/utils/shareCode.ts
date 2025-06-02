import LZString from 'lz-string';
import { type Strategy, type Task, type Player } from '../types';

const CODE_PREFIX = 'COW';
const CODE_VERSION = '1';

interface ShareData {
  strategy: Strategy;
  tasks: Task[];
  players: Player[];
  version: string;
}

// Generate a short, memorable code
function generateShortCode(): string {
  const adjectives = ['THUNDER', 'BLITZ', 'STORM', 'EAGLE', 'TIGER', 'WOLF', 'HAWK', 'STEEL'];
  const nouns = ['STRIKE', 'FORCE', 'GUARD', 'WING', 'SQUAD', 'UNIT', 'TEAM', 'PLAN'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `${adj}-${noun}-${num}`;
}

export function encodeStrategy(strategy: Strategy, tasks: Task[], players: Player[]): string {
  try {
    // Create a minimal version of the data to reduce size
    const minimalStrategy = {
      id: strategy.id,
      name: strategy.name,
      description: strategy.description,
      startDate: strategy.startDate,
      endDate: strategy.endDate,
      players: strategy.players || []
    };
    
    // Only include essential task data
    const minimalTasks = tasks.map(task => ({
      name: task.name,
      description: task.description,
      type: task.type,
      status: task.status,
      category: task.category,
      startDate: task.startDate,
      endDate: task.endDate,
      priority: task.priority,
      assignedPlayers: task.assignedPlayers || [],
      dependencies: task.dependencies || [],
      unitId: task.unitId
    }));
    
    // Only include essential player data
    const minimalPlayers = players.map(player => ({
      id: player.id,
      name: player.name,
      nation: player.nation,
      role: player.role,
      color: player.color
    }));
    
    const shareData: ShareData = {
      strategy: minimalStrategy as Strategy,
      tasks: minimalTasks as Task[],
      players: minimalPlayers as Player[],
      version: CODE_VERSION
    };
    
    // Compress the data
    const jsonString = JSON.stringify(shareData);
    
    // Check size before compression
    if (jsonString.length > 100000) {
      console.warn('Strategy data is very large, share code may be too long');
    }
    
    const compressed = LZString.compressToEncodedURIComponent(jsonString);
    
    // Generate a short code
    const shortCode = generateShortCode();
    
    // Return the share code
    return `${CODE_PREFIX}-${shortCode}-${compressed}`;
  } catch (error) {
    console.error('Failed to encode strategy:', error);
    // Return a fallback simple code
    return generateShareCode();
  }
}

export function decodeStrategy(code: string): ShareData | null {
  try {
    // Basic validation
    if (!code || typeof code !== 'string') {
      throw new Error('Invalid code');
    }
    
    // Limit code length to prevent memory issues
    if (code.length > 50000) {
      throw new Error('Code too long');
    }
    
    // Remove the prefix and extract compressed data
    if (!code.startsWith(CODE_PREFIX + '-')) {
      throw new Error('Invalid code format');
    }
    
    // Find where the compressed data starts (after pattern COW-WORD-WORD-NUMBER-)
    const parts = code.split('-');
    if (parts.length < 5) {
      throw new Error('Invalid code format');
    }
    
    // The compressed data starts after the 4th part (index 4)
    const compressed = parts.slice(4).join('-');
    
    // Limit compressed data size
    if (compressed.length > 45000) {
      throw new Error('Compressed data too large');
    }
    
    // Decompress and parse
    const decompressed = LZString.decompressFromEncodedURIComponent(compressed);
    if (!decompressed) {
      throw new Error('Failed to decompress data');
    }
    
    // Limit decompressed size to prevent JSON parse issues
    if (decompressed.length > 1000000) {
      throw new Error('Decompressed data too large');
    }
    
    const data = JSON.parse(decompressed) as ShareData;
    
    // Validate data structure
    if (!data || !data.strategy || !data.tasks || !data.players) {
      throw new Error('Invalid data structure');
    }
    
    // Validate version
    if (data.version !== CODE_VERSION) {
      throw new Error('Incompatible version');
    }
    
    return data;
  } catch (error) {
    console.error('Failed to decode strategy:', error);
    return null;
  }
}

// Generate a more user-friendly short code (without embedded data)
export function generateShareCode(): string {
  const shortCode = generateShortCode();
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  return `${CODE_PREFIX}-${shortCode}-${date}`;
}