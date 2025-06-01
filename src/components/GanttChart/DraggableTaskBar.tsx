import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { type Task, TaskType, TaskStatus, type Player } from '../../types';
import { CSS } from '@dnd-kit/utilities';

interface DraggableTaskBarProps {
  task: Task;
  left: number;
  width: number;
  players?: Player[];
  onClick?: () => void;
}

const getTaskColor = (type: TaskType, status: TaskStatus): string => {
  const baseColors = {
    UNIT_PRODUCTION: 'from-blue-600 to-blue-800',
    RESEARCH: 'from-purple-600 to-purple-800',
    MOVEMENT: 'from-green-600 to-green-800',
    ATTACK: 'from-red-600 to-red-800',
    DEFENSE: 'from-orange-600 to-orange-800',
    CONSTRUCTION: 'from-yellow-600 to-yellow-800',
    DIPLOMACY: 'from-indigo-600 to-indigo-800',
    CUSTOM: 'from-gray-600 to-gray-800'
  };
  
  const statusOpacity = {
    PENDING: 'opacity-60',
    IN_PROGRESS: 'opacity-100',
    COMPLETED: 'opacity-80',
    CANCELLED: 'opacity-40'
  };
  
  return `bg-gradient-to-r ${baseColors[type] || baseColors.CUSTOM} ${statusOpacity[status]}`;
};

export const DraggableTaskBar: React.FC<DraggableTaskBarProps> = ({ 
  task, 
  left, 
  width, 
  players = [],
  onClick 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: task.id,
    data: task,
  });

  const style = {
    left: `${left}%`,
    width: `${width}%`,
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const color = getTaskColor(task.type, task.status);
  const assignedPlayers = players.filter(p => task.assignedPlayers.includes(p.id));

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`absolute h-8 top-2 ${color} rounded cursor-move hover:scale-105 transition-all flex items-center justify-between px-2 text-white text-xs font-bebas shadow-lg border border-white/20`}
      {...listeners}
      {...attributes}
      onClick={onClick}
      title={`${task.name}\n${task.description || ''}\nAssigned to: ${assignedPlayers.map(p => p.name).join(', ') || 'Unassigned'}`}
    >
      <span className="truncate flex-1">{task.name}</span>
      {assignedPlayers.length > 0 && (
        <div className="flex gap-1 ml-2">
          {assignedPlayers.slice(0, 3).map((player) => (
            <div
              key={player.id}
              className="w-3 h-3 rounded-full border border-white/50"
              style={{ backgroundColor: player.color }}
              title={player.name}
            />
          ))}
          {assignedPlayers.length > 3 && (
            <div className="w-3 h-3 rounded-full bg-gray-500 border border-white/50 text-[8px] flex items-center justify-center">
              +{assignedPlayers.length - 3}
            </div>
          )}
        </div>
      )}
    </div>
  );
};