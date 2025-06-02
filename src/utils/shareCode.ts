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
  const shareData: ShareData = {
    strategy,
    tasks,
    players,
    version: CODE_VERSION
  };
  
  // Compress the data
  const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(shareData));
  
  // Generate a short code and store the mapping (in a real app, this would be stored in a database)
  const shortCode = generateShortCode();
  
  // For now, we'll embed the compressed data in the code
  // In production, you'd store this mapping server-side
  return `${CODE_PREFIX}-${shortCode}-${compressed}`;
}

export function decodeStrategy(code: string): ShareData | null {
  try {
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
    
    // Decompress and parse
    const decompressed = LZString.decompressFromEncodedURIComponent(compressed);
    if (!decompressed) {
      throw new Error('Failed to decompress data');
    }
    
    const data = JSON.parse(decompressed) as ShareData;
    
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