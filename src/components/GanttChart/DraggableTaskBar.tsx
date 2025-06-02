import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { type Task, TaskType, type Player, UnitType } from '../../types';
import { CSS } from '@dnd-kit/utilities';
import { GAME_UNITS } from '../../data/units';

interface DraggableTaskBarProps {
  task: Task;
  left: number;
  width: number;
  players?: Player[];
  onClick?: () => void;
}

const getTaskColor = (task: Task): string => {
  const { type, status, unitId } = task;
  
  // Unit-specific colors based on unit type
  const unitColors = {
    [UnitType.INFANTRY]: 'from-green-700 to-green-900', // Army green
    [UnitType.ARMOR]: 'from-gray-600 to-gray-800', // Steel gray
    [UnitType.ARTILLERY]: 'from-red-700 to-red-900', // Artillery red
    [UnitType.AIR_FORCE]: 'from-blue-600 to-blue-800', // Sky blue
    [UnitType.NAVY]: 'from-indigo-600 to-indigo-800', // Navy blue
    [UnitType.SUPPORT]: 'from-yellow-600 to-yellow-800' // Support yellow
  };
  
  // General task type colors for non-unit tasks
  const baseColors = {
    UNIT_PRODUCTION: 'from-teal-600 to-teal-800',
    RESEARCH: 'from-purple-600 to-purple-800',
    MOVEMENT: 'from-emerald-600 to-emerald-800',
    ATTACK: 'from-red-600 to-red-800',
    DEFENSE: 'from-orange-600 to-orange-800',
    CONSTRUCTION: 'from-amber-600 to-amber-800',
    DIPLOMACY: 'from-violet-600 to-violet-800',
    ESPIONAGE: 'from-gray-600 to-gray-800',
    TRADE: 'from-green-600 to-green-800',
    NAVAL_PATROL: 'from-blue-600 to-blue-800',
    AIR_MISSION: 'from-cyan-600 to-cyan-800',
    FORTIFICATION: 'from-yellow-600 to-yellow-800',
    CUSTOM: 'from-slate-600 to-slate-800'
  };
  
  const statusOpacity = {
    PENDING: 'opacity-70',
    IN_PROGRESS: 'opacity-100',
    COMPLETED: 'opacity-85',
    CANCELLED: 'opacity-40'
  };
  
  // If it's a unit production task and we have the unit, use unit-specific colors
  let colorGradient;
  if (type === TaskType.UNIT_PRODUCTION && unitId && GAME_UNITS[unitId]) {
    const unit = GAME_UNITS[unitId];
    colorGradient = unitColors[unit.type] || baseColors.UNIT_PRODUCTION;
  } else {
    colorGradient = baseColors[type] || baseColors.CUSTOM;
  }
  
  return `bg-gradient-to-r ${colorGradient} ${statusOpacity[status]}`;
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

  const color = getTaskColor(task);
  const assignedPlayers = players.filter(p => task.assignedPlayers.includes(p.id));
  
  // Enhanced tooltip with unit data
  const getTooltipText = () => {
    let tooltip = `${task.name}\n${task.description || ''}`;
    
    // Add unit-specific information
    if (task.unitId && GAME_UNITS[task.unitId]) {
      const unit = GAME_UNITS[task.unitId];
      tooltip += `\n\n🏭 Unit Details:`;
      tooltip += `\n• Type: ${unit.type.replace('_', ' ')}`;
      tooltip += `\n• Build Time: ${unit.buildTime} minutes`;
      if (unit.resources.manpower) tooltip += `\n• Manpower: ${unit.resources.manpower.toLocaleString()}`;
      if (unit.resources.money) tooltip += `\n• Money: $${unit.resources.money.toLocaleString()}`;
      if (unit.resources.oil) tooltip += `\n• Oil: ${unit.resources.oil.toLocaleString()}`;
      if (unit.resources.metal) tooltip += `\n• Metal: ${unit.resources.metal.toLocaleString()}`;
      if (unit.resources.rareMetals) tooltip += `\n• Rare Metals: ${unit.resources.rareMetals.toLocaleString()}`;
    }
    
    tooltip += `\n\n👥 Assigned: ${assignedPlayers.map(p => p.name).join(', ') || 'Unassigned'}`;
    tooltip += `\n📋 Status: ${task.status.replace('_', ' ')}`;
    tooltip += `\n⭐ Priority: ${task.priority}/3`;
    
    return tooltip;
  };
  
  // Format resource costs for display
  const getResourceSummary = () => {
    if (!task.unitId || !GAME_UNITS[task.unitId]) return null;
    
    const unit = GAME_UNITS[task.unitId];
    const resources = [];
    
    if (unit.resources.money) resources.push(`💰${(unit.resources.money / 1000).toFixed(0)}k`);
    if (unit.resources.manpower) resources.push(`👤${(unit.resources.manpower / 1000).toFixed(0)}k`);
    if (unit.resources.oil) resources.push(`🛢️${(unit.resources.oil / 1000).toFixed(0)}k`);
    if (unit.resources.metal) resources.push(`⚙️${(unit.resources.metal / 1000).toFixed(0)}k`);
    if (unit.resources.rareMetals) resources.push(`💎${(unit.resources.rareMetals / 1000).toFixed(0)}k`);
    
    return resources.slice(0, 2).join(' '); // Show only first 2 resources to save space
  };
  
  const resourceSummary = getResourceSummary();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`absolute h-8 md:h-8 top-1 md:top-2 ${color} rounded cursor-move hover:scale-105 transition-all flex items-center justify-between px-1 md:px-2 text-white text-xs font-bebas shadow-lg border border-white/20 group touch-manipulation`}
      {...listeners}
      {...attributes}
      onClick={onClick}
      title={getTooltipText()}
    >
      <span className="truncate flex-1">{task.name}</span>
      
      {/* Resource summary - visible on hover for unit production tasks */}
      {resourceSummary && width > 15 && (
        <div className="text-[8px] text-white/80 opacity-0 group-hover:opacity-100 transition-opacity ml-1 hidden group-hover:block">
          {resourceSummary}
        </div>
      )}
      
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