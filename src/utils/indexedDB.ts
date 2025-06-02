interface StrategyRevision {
  id: string;
  strategyId: string;
  version: number;
  timestamp: Date;
  author: string;
  strategy: any;
  tasks: any[];
  players: any[];
  milestones: any[];
  changeDescription: string;
  isAutoSave: boolean;
}

interface SyncSettings {
  enabled: boolean;
  mode: 'manual' | 'auto' | 'live';
  autoSaveInterval: number; // in milliseconds
}

interface P2PSession {
  roomCode: string;
  strategyId: string;
  hostId: string;
  createdAt: Date;
  lastActive: Date;
  participants: P2PParticipant[];
}

interface P2PParticipant {
  id: string;
  username: string;
  isHost: boolean;
  joinedAt: Date;
}

class IndexedDBManager {
  private dbName = 'CallOfWarPlanner';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Strategies store
        if (!db.objectStoreNames.contains('strategies')) {
          const strategiesStore = db.createObjectStore('strategies', { keyPath: 'id' });
          strategiesStore.createIndex('createdAt', 'createdAt');
        }

        // Revisions store
        if (!db.objectStoreNames.contains('revisions')) {
          const revisionsStore = db.createObjectStore('revisions', { keyPath: 'id' });
          revisionsStore.createIndex('strategyId', 'strategyId');
          revisionsStore.createIndex('timestamp', 'timestamp');
          revisionsStore.createIndex('version', 'version');
        }

        // Sync settings store
        if (!db.objectStoreNames.contains('syncSettings')) {
          db.createObjectStore('syncSettings', { keyPath: 'strategyId' });
        }

        // P2P sessions store (for future use)
        if (!db.objectStoreNames.contains('p2pSessions')) {
          const sessionsStore = db.createObjectStore('p2pSessions', { keyPath: 'roomCode' });
          sessionsStore.createIndex('lastActive', 'lastActive');
        }
      };
    });
  }

  // Strategy operations
  async saveStrategy(strategy: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['strategies'], 'readwrite');
    const store = transaction.objectStore('strategies');
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put(strategy);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getStrategy(id: string): Promise<any | null> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['strategies'], 'readonly');
    const store = transaction.objectStore('strategies');
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllStrategies(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['strategies'], 'readonly');
    const store = transaction.objectStore('strategies');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Revision operations
  async saveRevision(revision: Omit<StrategyRevision, 'id'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const revisionWithId: StrategyRevision = {
      ...revision,
      id: `${revision.strategyId}-v${revision.version}-${Date.now()}`,
    };

    const transaction = this.db.transaction(['revisions'], 'readwrite');
    const store = transaction.objectStore('revisions');
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put(revisionWithId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    return revisionWithId.id;
  }

  async getRevisions(strategyId: string): Promise<StrategyRevision[]> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['revisions'], 'readonly');
    const store = transaction.objectStore('revisions');
    const index = store.index('strategyId');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(strategyId);
      request.onsuccess = () => {
        const revisions = request.result.sort((a, b) => b.version - a.version);
        resolve(revisions);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getLatestRevision(strategyId: string): Promise<StrategyRevision | null> {
    const revisions = await this.getRevisions(strategyId);
    return revisions.length > 0 ? revisions[0] : null;
  }

  async getNextVersion(strategyId: string): Promise<number> {
    const latestRevision = await this.getLatestRevision(strategyId);
    return latestRevision ? latestRevision.version + 1 : 1;
  }

  // Sync settings operations
  async getSyncSettings(strategyId: string): Promise<SyncSettings> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['syncSettings'], 'readonly');
    const store = transaction.objectStore('syncSettings');
    
    return new Promise((resolve, reject) => {
      const request = store.get(strategyId);
      request.onsuccess = () => {
        const result = request.result || {
          enabled: true,
          mode: 'auto' as const,
          autoSaveInterval: 2000, // 2 seconds
        };
        resolve(result);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async updateSyncSettings(strategyId: string, settings: Partial<SyncSettings>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const currentSettings = await this.getSyncSettings(strategyId);
    const updatedSettings = { ...currentSettings, ...settings, strategyId };

    const transaction = this.db.transaction(['syncSettings'], 'readwrite');
    const store = transaction.objectStore('syncSettings');
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put(updatedSettings);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Cleanup operations
  async cleanupOldRevisions(strategyId: string, keepCount: number = 50): Promise<void> {
    const revisions = await this.getRevisions(strategyId);
    
    if (revisions.length <= keepCount) return;

    const toDelete = revisions.slice(keepCount);
    const transaction = this.db!.transaction(['revisions'], 'readwrite');
    const store = transaction.objectStore('revisions');

    for (const revision of toDelete) {
      store.delete(revision.id);
    }
  }

  // P2P Session operations
  async saveP2PSession(session: P2PSession): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['p2pSessions'], 'readwrite');
    const store = transaction.objectStore('p2pSessions');
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put(session);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getP2PSession(roomCode: string): Promise<P2PSession | null> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['p2pSessions'], 'readonly');
    const store = transaction.objectStore('p2pSessions');
    
    return new Promise((resolve, reject) => {
      const request = store.get(roomCode);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllP2PSessions(): Promise<P2PSession[]> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['p2pSessions'], 'readonly');
    const store = transaction.objectStore('p2pSessions');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateP2PSession(roomCode: string, updates: Partial<P2PSession>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const currentSession = await this.getP2PSession(roomCode);
    if (!currentSession) throw new Error('Session not found');

    const updatedSession = { ...currentSession, ...updates };
    await this.saveP2PSession(updatedSession);
  }

  async deleteP2PSession(roomCode: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['p2pSessions'], 'readwrite');
    const store = transaction.objectStore('p2pSessions');
    
    await new Promise<void>((resolve, reject) => {
      const request = store.delete(roomCode);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Singleton instance
export const dbManager = new IndexedDBManager();

// Initialize on module load
dbManager.init().catch(console.error);

export type { StrategyRevision, SyncSettings, P2PSession, P2PParticipant };