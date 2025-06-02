import React from 'react';
import { FaExclamationTriangle, FaCodeBranch, FaExchangeAlt, FaClock, FaTimes, FaCheck } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';

interface ConflictNotification {
  id: string;
  type: 'merge' | 'override' | 'dependency_wait';
  message: string;
  timestamp: Date;
  autoResolve: boolean;
}

interface ConflictNotificationsProps {
  notifications: ConflictNotification[];
  onDismiss: (notificationId: string) => void;
}

export const ConflictNotifications: React.FC<ConflictNotificationsProps> = ({
  notifications,
  onDismiss,
}) => {
  if (notifications.length === 0) return null;

  const getIcon = (type: ConflictNotification['type']) => {
    switch (type) {
      case 'merge':
        return <FaCodeBranch className="text-blue-400" />;
      case 'override':
        return <FaExchangeAlt className="text-yellow-400" />;
      case 'dependency_wait':
        return <FaClock className="text-orange-400" />;
      default:
        return <FaExclamationTriangle className="text-red-400" />;
    }
  };

  const getTypeLabel = (type: ConflictNotification['type']) => {
    switch (type) {
      case 'merge':
        return 'Merged';
      case 'override':
        return 'Transformed';
      case 'dependency_wait':
        return 'Waiting';
      default:
        return 'Conflict';
    }
  };

  const getBorderColor = (type: ConflictNotification['type']) => {
    switch (type) {
      case 'merge':
        return 'border-blue-400/50';
      case 'override':
        return 'border-yellow-400/50';
      case 'dependency_wait':
        return 'border-orange-400/50';
      default:
        return 'border-red-400/50';
    }
  };

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`bg-cod-primary/95 backdrop-blur-sm border-2 ${getBorderColor(notification.type)} rounded-lg p-3 shadow-2xl animate-slideInRight`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {getIcon(notification.type)}
              <span className="text-sm font-bebas text-cod-accent">
                {getTypeLabel(notification.type)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {notification.autoResolve && (
                <FaCheck className="text-green-400 text-xs" title="Auto-resolved" />
              )}
              <button
                onClick={() => onDismiss(notification.id)}
                className="text-gray-400 hover:text-gray-300 transition-colors"
              >
                <FaTimes className="text-xs" />
              </button>
            </div>
          </div>

          {/* Message */}
          <p className="text-gray-300 text-sm mb-2">{notification.message}</p>

          {/* Timestamp */}
          <div className="text-xs text-gray-500">
            {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
          </div>
        </div>
      ))}
    </div>
  );
};