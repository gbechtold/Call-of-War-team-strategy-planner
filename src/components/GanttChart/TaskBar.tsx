import React from 'react';
import { Task, TaskType, TaskStatus } from '../../types';

interface TaskBarProps {
  task: Task;
  left: number;
  width: number;
  onClick?: () => void;
}

const getTaskColor = (type: TaskType, status: TaskStatus): string => {
  const colors = {
    UNIT_PRODUCTION: {
      PENDING: 'bg-blue-400',
      IN_PROGRESS: 'bg-blue-500',
      COMPLETED: 'bg-blue-600',
      CANCELLED: 'bg-gray-400'
    },
    RESEARCH: {
      PENDING: 'bg-purple-400',
      IN_PROGRESS: 'bg-purple-500',
      COMPLETED: 'bg-purple-600',
      CANCELLED: 'bg-gray-400'
    },
    MOVEMENT: {
      PENDING: 'bg-green-400',
      IN_PROGRESS: 'bg-green-500',
      COMPLETED: 'bg-green-600',
      CANCELLED: 'bg-gray-400'
    },
    ATTACK: {
      PENDING: 'bg-red-400',
      IN_PROGRESS: 'bg-red-500',
      COMPLETED: 'bg-red-600',
      CANCELLED: 'bg-gray-400'
    },
    DEFENSE: {
      PENDING: 'bg-orange-400',
      IN_PROGRESS: 'bg-orange-500',
      COMPLETED: 'bg-orange-600',
      CANCELLED: 'bg-gray-400'
    },
    CONSTRUCTION: {
      PENDING: 'bg-yellow-400',
      IN_PROGRESS: 'bg-yellow-500',
      COMPLETED: 'bg-yellow-600',
      CANCELLED: 'bg-gray-400'
    },
    DIPLOMACY: {
      PENDING: 'bg-indigo-400',
      IN_PROGRESS: 'bg-indigo-500',
      COMPLETED: 'bg-indigo-600',
      CANCELLED: 'bg-gray-400'
    },
    CUSTOM: {
      PENDING: 'bg-gray-400',
      IN_PROGRESS: 'bg-gray-500',
      COMPLETED: 'bg-gray-600',
      CANCELLED: 'bg-gray-400'
    }
  };
  
  return colors[type]?.[status] || 'bg-gray-500';
};

export const TaskBar: React.FC<TaskBarProps> = ({ task, left, width, onClick }) => {
  const color = getTaskColor(task.type, task.status);
  
  return (
    <div
      className={`absolute h-8 top-2 ${color} rounded cursor-pointer hover:opacity-90 transition-opacity flex items-center px-2 text-white text-xs font-medium shadow-md`}
      style={{ left: `${left}%`, width: `${width}%` }}
      onClick={onClick}
      title={`${task.name}\n${task.description || ''}`}
    >
      <span className="truncate">{task.name}</span>
    </div>
  );
};