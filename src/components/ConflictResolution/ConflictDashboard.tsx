import React from 'react';
import { FaChartBar, FaCodeBranch, FaExchangeAlt, FaCheck, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';

interface ConflictStats {
  totalConflicts: number;
  recentConflicts: number;
  resolutionTypes: {
    accept: number;
    merge: number;
    transform: number;
    reject: number;
  };
  conflictTypes: {
    concurrent_edit: number;
    dependency_violation: number;
    ordering_conflict: number;
  };
}

interface ConflictDashboardProps {
  stats: ConflictStats;
  lastResolution: Date | null;
  isProcessing: boolean;
}

export const ConflictDashboard: React.FC<ConflictDashboardProps> = ({
  stats,
  lastResolution,
  isProcessing,
}) => {
  const getResolutionIcon = (type: string) => {
    switch (type) {
      case 'accept':
        return <FaCheck className="text-green-400" />;
      case 'merge':
        return <FaCodeBranch className="text-blue-400" />;
      case 'transform':
        return <FaExchangeAlt className="text-yellow-400" />;
      case 'reject':
        return <FaTimes className="text-red-400" />;
      default:
        return <FaExclamationTriangle className="text-gray-400" />;
    }
  };

  const getConflictTypeIcon = (type: string) => {
    switch (type) {
      case 'concurrent_edit':
        return '✏️';
      case 'dependency_violation':
        return '🔗';
      case 'ordering_conflict':
        return '🔄';
      default:
        return '❓';
    }
  };

  const getConflictTypeLabel = (type: string) => {
    switch (type) {
      case 'concurrent_edit':
        return 'Concurrent Edits';
      case 'dependency_violation':
        return 'Dependency Issues';
      case 'ordering_conflict':
        return 'Ordering Conflicts';
      default:
        return type;
    }
  };

  return (
    <div className="bg-cod-secondary/90 backdrop-blur-sm p-3 rounded-lg shadow-2xl border-2 border-cod-accent/20 w-72">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bebas text-cod-accent flex items-center gap-2">
          <FaChartBar /> Conflict Resolution
        </h2>
        {isProcessing && (
          <div className="animate-spin w-4 h-4 border border-cod-accent border-t-transparent rounded-full" />
        )}
      </div>

      {/* Overview Stats */}
      <div className="mb-4 p-3 bg-cod-primary/30 rounded border border-cod-accent/20">
        <div className="grid grid-cols-2 gap-3 text-center">
          <div>
            <div className="text-xl font-bold text-cod-accent">{stats.totalConflicts}</div>
            <div className="text-xs text-gray-400">Total Conflicts</div>
          </div>
          <div>
            <div className="text-xl font-bold text-orange-400">{stats.recentConflicts}</div>
            <div className="text-xs text-gray-400">Last Hour</div>
          </div>
        </div>
        {lastResolution && (
          <div className="text-center mt-2 pt-2 border-t border-cod-accent/20">
            <div className="text-xs text-gray-500">
              Last resolved: {formatDistanceToNow(lastResolution, { addSuffix: true })}
            </div>
          </div>
        )}
      </div>

      {/* Resolution Types */}
      <div className="mb-4">
        <h3 className="text-sm font-bebas text-cod-accent mb-2">Resolution Methods</h3>
        <div className="space-y-2">
          {Object.entries(stats.resolutionTypes).map(([type, count]) => (
            <div key={type} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {getResolutionIcon(type)}
                <span className="text-gray-300 capitalize">{type}</span>
              </div>
              <span className="text-cod-accent font-mono">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Conflict Types */}
      <div className="mb-4">
        <h3 className="text-sm font-bebas text-cod-accent mb-2">Conflict Types</h3>
        <div className="space-y-2">
          {Object.entries(stats.conflictTypes).map(([type, count]) => (
            <div key={type} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getConflictTypeIcon(type)}</span>
                <span className="text-gray-300">{getConflictTypeLabel(type)}</span>
              </div>
              <span className="text-cod-accent font-mono">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Resolution Rate */}
      <div className="p-3 bg-cod-primary/30 rounded border border-cod-accent/20">
        <div className="text-sm text-gray-300 mb-1">Resolution Rate</div>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-cod-secondary rounded-full h-2">
            <div
              className="bg-green-400 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${stats.totalConflicts > 0 
                  ? ((stats.resolutionTypes.accept + stats.resolutionTypes.merge + stats.resolutionTypes.transform) / stats.totalConflicts) * 100 
                  : 0}%`
              }}
            />
          </div>
          <span className="text-xs text-green-400 font-mono">
            {stats.totalConflicts > 0 
              ? Math.round(((stats.resolutionTypes.accept + stats.resolutionTypes.merge + stats.resolutionTypes.transform) / stats.totalConflicts) * 100)
              : 100}%
          </span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-cod-accent/20">
        <p className="text-xs text-gray-500">
          Automatic conflict resolution using Operational Transformation (OT) algorithm.
        </p>
      </div>
    </div>
  );
};