// Operational Transformation (OT) system for conflict resolution
// Based on the Jupiter algorithm for real-time collaborative editing

export interface VectorClock {
  [peerId: string]: number;
}

export interface Operation {
  id: string;
  type: 'create' | 'update' | 'delete' | 'move';
  target: 'strategy' | 'task' | 'milestone' | 'player';
  targetId: string;
  data: any;
  vectorClock: VectorClock;
  timestamp: Date;
  author: string;
  dependencies?: string[]; // IDs of operations this depends on
}

export interface ConflictResolution {
  operation: Operation;
  resolvedOperation: Operation;
  conflictType: 'concurrent_edit' | 'dependency_violation' | 'ordering_conflict';
  resolution: 'accept' | 'reject' | 'merge' | 'transform';
  mergedData?: any;
}

class OperationalTransformEngine {
  private localVectorClock: VectorClock = {};
  private operationHistory: Operation[] = [];
  private pendingOperations: Map<string, Operation> = new Map();
  private peerId: string;

  constructor(peerId: string) {
    this.peerId = peerId;
    this.localVectorClock[peerId] = 0;
  }

  // Generate a new operation
  createOperation(
    type: Operation['type'],
    target: Operation['target'],
    targetId: string,
    data: any,
    dependencies: string[] = []
  ): Operation {
    // Increment local clock
    this.localVectorClock[this.peerId] = (this.localVectorClock[this.peerId] || 0) + 1;

    const operation: Operation = {
      id: this.generateOperationId(),
      type,
      target,
      targetId,
      data,
      vectorClock: { ...this.localVectorClock },
      timestamp: new Date(),
      author: this.peerId,
      dependencies,
    };

    // Add to history
    this.operationHistory.push(operation);
    
    return operation;
  }

  // Apply a remote operation with conflict resolution
  applyRemoteOperation(operation: Operation): ConflictResolution {
    // Update vector clock
    this.updateVectorClock(operation.vectorClock);

    // Check for conflicts
    const conflict = this.detectConflict(operation);
    
    if (conflict) {
      return this.resolveConflict(operation, conflict);
    }

    // No conflict, apply directly
    this.operationHistory.push(operation);
    return {
      operation,
      resolvedOperation: operation,
      conflictType: 'concurrent_edit',
      resolution: 'accept',
    };
  }

  // Detect conflicts between operations
  private detectConflict(remoteOp: Operation): Operation | null {
    // Find concurrent operations (same target, overlapping time window)
    const concurrentOps = this.operationHistory.filter(localOp => 
      localOp.target === remoteOp.target &&
      localOp.targetId === remoteOp.targetId &&
      localOp.author !== remoteOp.author &&
      this.areConcurrent(localOp.vectorClock, remoteOp.vectorClock) &&
      Math.abs(localOp.timestamp.getTime() - remoteOp.timestamp.getTime()) < 5000 // 5 second window
    );

    return concurrentOps.length > 0 ? concurrentOps[0] : null;
  }

  // Check if two operations are concurrent (neither happened before the other)
  private areConcurrent(clock1: VectorClock, clock2: VectorClock): boolean {
    let clock1Before = true;
    let clock2Before = true;

    // Get all peer IDs from both clocks
    const allPeers = new Set([...Object.keys(clock1), ...Object.keys(clock2)]);

    for (const peerId of allPeers) {
      const t1 = clock1[peerId] || 0;
      const t2 = clock2[peerId] || 0;

      if (t1 > t2) clock2Before = false;
      if (t2 > t1) clock1Before = false;
    }

    // Concurrent if neither is before the other
    return !clock1Before && !clock2Before;
  }

  // Resolve conflicts using operational transformation
  private resolveConflict(remoteOp: Operation, localOp: Operation): ConflictResolution {
    const conflictType = this.getConflictType(remoteOp, localOp);

    switch (conflictType) {
      case 'concurrent_edit':
        return this.resolveConcurrentEdit(remoteOp, localOp);
      
      case 'dependency_violation':
        return this.resolveDependencyViolation(remoteOp, localOp);
      
      case 'ordering_conflict':
        return this.resolveOrderingConflict(remoteOp, localOp);
      
      default:
        return {
          operation: remoteOp,
          resolvedOperation: remoteOp,
          conflictType,
          resolution: 'accept',
        };
    }
  }

  // Determine the type of conflict
  private getConflictType(remoteOp: Operation, localOp: Operation): ConflictResolution['conflictType'] {
    // Check for dependency violations
    if (remoteOp.dependencies && this.hasDependencyViolation(remoteOp)) {
      return 'dependency_violation';
    }

    // Check for ordering conflicts (e.g., moving tasks)
    if (remoteOp.type === 'move' || localOp.type === 'move') {
      return 'ordering_conflict';
    }

    // Default to concurrent edit
    return 'concurrent_edit';
  }

  // Resolve concurrent edits by merging changes
  private resolveConcurrentEdit(remoteOp: Operation, localOp: Operation): ConflictResolution {
    if (remoteOp.type === 'update' && localOp.type === 'update') {
      // Merge updates by taking newer timestamp for each field
      const mergedData = this.mergeUpdates(remoteOp.data, localOp.data, remoteOp.timestamp, localOp.timestamp);
      
      const resolvedOp: Operation = {
        ...remoteOp,
        data: mergedData,
        id: this.generateOperationId(),
        timestamp: new Date(),
      };

      this.operationHistory.push(resolvedOp);

      return {
        operation: remoteOp,
        resolvedOperation: resolvedOp,
        conflictType: 'concurrent_edit',
        resolution: 'merge',
        mergedData,
      };
    }

    // For non-update operations, use timestamp-based priority
    const useRemote = remoteOp.timestamp > localOp.timestamp;
    
    return {
      operation: remoteOp,
      resolvedOperation: useRemote ? remoteOp : localOp,
      conflictType: 'concurrent_edit',
      resolution: useRemote ? 'accept' : 'reject',
    };
  }

  // Resolve dependency violations by reordering
  private resolveDependencyViolation(remoteOp: Operation, _localOp: Operation): ConflictResolution {
    // Add to pending operations until dependencies are resolved
    this.pendingOperations.set(remoteOp.id, remoteOp);
    
    return {
      operation: remoteOp,
      resolvedOperation: remoteOp,
      conflictType: 'dependency_violation',
      resolution: 'reject', // Will be retried later
    };
  }

  // Resolve ordering conflicts (e.g., moving tasks)
  private resolveOrderingConflict(remoteOp: Operation, localOp: Operation): ConflictResolution {
    // For move operations, apply operational transformation
    if (remoteOp.type === 'move' && localOp.type === 'move') {
      const transformedOp = this.transformMoveOperation(remoteOp, localOp);
      
      this.operationHistory.push(transformedOp);
      
      return {
        operation: remoteOp,
        resolvedOperation: transformedOp,
        conflictType: 'ordering_conflict',
        resolution: 'transform',
      };
    }

    // Default resolution for other ordering conflicts
    return {
      operation: remoteOp,
      resolvedOperation: remoteOp,
      conflictType: 'ordering_conflict',
      resolution: 'accept',
    };
  }

  // Merge updates by taking the most recent value for each field
  private mergeUpdates(remoteData: any, localData: any, remoteTime: Date, localTime: Date): any {
    const merged = { ...localData };

    for (const [key, remoteValue] of Object.entries(remoteData)) {
      if (remoteValue !== undefined) {
        // If remote operation is newer, use its value
        if (remoteTime > localTime) {
          merged[key] = remoteValue;
        }
        // For equal timestamps, use lexicographic comparison of operation IDs
        else if (remoteTime.getTime() === localTime.getTime()) {
          // Keep existing value (local takes precedence on ties)
        }
      }
    }

    return merged;
  }

  // Transform move operations to maintain consistency
  private transformMoveOperation(remoteOp: Operation, localOp: Operation): Operation {
    const { fromIndex: remoteFrom, toIndex: remoteTo } = remoteOp.data;
    const { fromIndex: localFrom, toIndex: localTo } = localOp.data;

    let transformedTo = remoteTo;

    // Apply transformation rules
    if (localFrom < localTo) {
      // Local move was forward
      if (remoteFrom < localFrom && remoteTo > localFrom) {
        transformedTo = remoteTo - 1;
      }
    } else {
      // Local move was backward
      if (remoteFrom > localFrom && remoteTo < localFrom) {
        transformedTo = remoteTo + 1;
      }
    }

    return {
      ...remoteOp,
      data: {
        ...remoteOp.data,
        toIndex: transformedTo,
      },
      id: this.generateOperationId(),
    };
  }

  // Check if an operation has dependency violations
  private hasDependencyViolation(operation: Operation): boolean {
    if (!operation.dependencies) return false;

    return operation.dependencies.some(depId => 
      !this.operationHistory.some(op => op.id === depId)
    );
  }

  // Update local vector clock with remote clock
  private updateVectorClock(remoteClock: VectorClock): void {
    for (const [peerId, remoteTime] of Object.entries(remoteClock)) {
      const localTime = this.localVectorClock[peerId] || 0;
      this.localVectorClock[peerId] = Math.max(localTime, remoteTime);
    }
  }

  // Generate unique operation ID
  private generateOperationId(): string {
    return `${this.peerId}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  // Get current vector clock
  getVectorClock(): VectorClock {
    return { ...this.localVectorClock };
  }

  // Process pending operations that may now be ready
  processPendingOperations(): ConflictResolution[] {
    const resolutions: ConflictResolution[] = [];
    const toRemove: string[] = [];

    for (const [opId, operation] of this.pendingOperations) {
      if (!this.hasDependencyViolation(operation)) {
        const resolution = this.applyRemoteOperation(operation);
        resolutions.push(resolution);
        toRemove.push(opId);
      }
    }

    // Remove processed operations
    toRemove.forEach(id => this.pendingOperations.delete(id));

    return resolutions;
  }

  // Get operation history for debugging
  getOperationHistory(): Operation[] {
    return [...this.operationHistory];
  }

  // Clear old operations to prevent memory bloat
  cleanupHistory(keepCount: number = 1000): void {
    if (this.operationHistory.length > keepCount) {
      this.operationHistory = this.operationHistory.slice(-keepCount);
    }
  }
}

// Singleton instance for the current session
let otEngine: OperationalTransformEngine | null = null;

export const getOTEngine = (peerId?: string): OperationalTransformEngine => {
  if (!otEngine && peerId) {
    otEngine = new OperationalTransformEngine(peerId);
  }
  if (!otEngine) {
    throw new Error('OT Engine not initialized. Provide a peerId first.');
  }
  return otEngine;
};

export const resetOTEngine = (): void => {
  otEngine = null;
};

export { OperationalTransformEngine };