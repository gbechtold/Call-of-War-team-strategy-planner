import React, { useState, useRef } from 'react';
import { DndContext, type DragEndEvent, DragOverlay, MouseSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
import { type Task, type Unit } from '../../types';
import { format, addDays, differenceInDays } from 'date-fns';
import { DraggableTaskBar } from './DraggableTaskBar';
import { TaskBar } from './TaskBar';
import { TaskDependencies } from '../TaskDependencies/TaskDependencies';
import { useStrategyStore } from '../../store/useStrategyStore';

interface GanttChartProps {
  tasks: Task[];
  startDate: Date;
  endDate: Date;
  onTaskClick?: (task: Task) => void;
  onTaskMove?: (taskId: string, newStartDate: Date, newEndDate: Date) => void;
  onUnitDrop?: (unit: Unit, dropDate: Date) => void;
}

interface DroppableTimelineProps {
  date: Date;
  children: React.ReactNode;
}

const DroppableTimeline: React.FC<DroppableTimelineProps> = ({ date, children }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `timeline-${date.toISOString()}`,
    data: { date }
  });

  return (
    <div
      ref={setNodeRef}
      className={`h-full min-w-[40px] ${isOver ? 'bg-cod-accent/20' : ''} transition-colors`}
    >
      {children}
    </div>
  );
};

export const GanttChart: React.FC<GanttChartProps> = ({ 
  tasks, 
  startDate, 
  endDate,
  onTaskClick,
  onTaskMove,
  onUnitDrop
}) => {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [draggedUnit, setDraggedUnit] = React.useState<Unit | null>(null);
  const [timelineOffset, setTimelineOffset] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);
  
  // Extended timeline - show 60 days total (30 days into future from end date)
  const extendedEndDate = addDays(endDate, 30);
  const totalDays = differenceInDays(extendedEndDate, startDate) + 1;
  const visibleDays = Math.min(14, totalDays); // Show 2 weeks at a time
  
  const { players } = useStrategyStore();
  
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );
  
  const handleDragStart = (event: any) => {
    const { active } = event;
    
    if (active.data.current?.type === 'unit') {
      setDraggedUnit(active.data.current.unit || null);
      setActiveId(null);
    } else {
      setActiveId(active.id as string);
      setDraggedUnit(null);
    }
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta, over } = event;
    
    // Handle unit drop to timeline
    if (active.data.current?.type === 'unit' && over?.data.current?.date) {
      const unit = active.data.current.unit;
      const dropDate = over.data.current.date;
      onUnitDrop?.(unit, dropDate);
      setDraggedUnit(null);
      return;
    }
    
    // Handle task move
    if (!active || !delta || !onTaskMove || active.data.current?.type === 'unit') {
      setActiveId(null);
      setDraggedUnit(null);
      return;
    }
    
    const task = tasks.find(t => t.id === active.id);
    if (!task) {
      setActiveId(null);
      return;
    }
    
    // Calculate days moved based on drag distance and current timeline scale
    const dayWidth = (timelineRef.current?.scrollWidth || 800) / totalDays;
    const daysMoved = Math.round(delta.x / dayWidth);
    
    const newStartDate = addDays(new Date(task.startDate), daysMoved);
    const newEndDate = addDays(new Date(task.endDate), daysMoved);
    
    // Allow tasks to be scheduled anywhere in the extended timeline
    if (newStartDate >= startDate && newEndDate <= extendedEndDate) {
      onTaskMove(task.id, newStartDate, newEndDate);
    }
    
    setActiveId(null);
    setDraggedUnit(null);
  };
  
  const handleTimelineScroll = (direction: 'left' | 'right') => {
    const scrollAmount = 7; // Scroll by 1 week
    const maxOffset = Math.max(0, totalDays - visibleDays);
    
    if (direction === 'left') {
      setTimelineOffset(Math.max(0, timelineOffset - scrollAmount));
    } else {
      setTimelineOffset(Math.min(maxOffset, timelineOffset + scrollAmount));
    }
  };
  
  const renderTimelineHeader = () => {
    const headers = [];
    const visibleStartDate = addDays(startDate, timelineOffset);
    
    // Create day headers
    for (let i = 0; i < visibleDays; i++) {
      const currentDate = addDays(visibleStartDate, i);
      headers.push(
        <div key={i} className="min-w-[40px] text-center text-xs border-r border-cod-accent/20 p-1">
          <div className="font-bebas text-cod-accent text-[10px]">{format(currentDate, 'EEE')}</div>
          <div className="text-gray-400 text-[10px]">{format(currentDate, 'd')}</div>
          <div className="text-gray-500 text-[8px]">{format(currentDate, 'MMM')}</div>
        </div>
      );
    }
    
    return (
      <div className="flex">
        <button
          onClick={() => handleTimelineScroll('left')}
          disabled={timelineOffset === 0}
          className="w-8 bg-cod-primary border-r border-cod-accent/20 text-cod-accent hover:bg-cod-accent/10 disabled:opacity-30 disabled:cursor-not-allowed text-sm"
        >
          ‹
        </button>
        <div className="flex-1 flex">
          {headers}
        </div>
        <button
          onClick={() => handleTimelineScroll('right')}
          disabled={timelineOffset >= totalDays - visibleDays}
          className="w-8 bg-cod-primary border-l border-cod-accent/20 text-cod-accent hover:bg-cod-accent/10 disabled:opacity-30 disabled:cursor-not-allowed text-sm"
        >
          ›
        </button>
      </div>
    );
  };
  
  const calculateTaskPosition = (task: Task) => {
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);
    
    // Calculate position relative to the visible timeline
    const visibleStartDate = addDays(startDate, timelineOffset);
    const startOffset = differenceInDays(taskStart, visibleStartDate);
    const endOffset = differenceInDays(taskEnd, visibleStartDate) + 1;
    
    // Only show tasks that are visible in current timeline window
    if (endOffset < 0 || startOffset >= visibleDays) {
      return null; // Task not visible
    }
    
    const clampedStartOffset = Math.max(0, startOffset);
    const clampedEndOffset = Math.min(visibleDays, endOffset);
    const duration = clampedEndOffset - clampedStartOffset;
    
    return {
      left: (clampedStartOffset / visibleDays) * 100,
      width: (duration / visibleDays) * 100
    };
  };
  
  const groupedTasks = tasks.reduce((acc, task) => {
    const category = task.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(task);
    return acc;
  }, {} as Record<string, Task[]>);
  
  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;
  
  // Create timeline days for drop zones (only visible days)
  const timelineDays: Date[] = [];
  const visibleStartDate = addDays(startDate, timelineOffset);
  for (let i = 0; i < visibleDays; i++) {
    timelineDays.push(addDays(visibleStartDate, i));
  }
  
  // Get all visible tasks for dependency visualization
  const visibleTasks = tasks.filter(task => calculateTaskPosition(task) !== null);
  
  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="bg-cod-secondary rounded-lg shadow-2xl overflow-hidden border-2 border-cod-accent/20">
        <div className="flex">
          <div className="w-40 bg-cod-primary">
            <div className="h-16 border-b border-cod-accent/30 p-2 font-bebas text-cod-accent flex items-end text-sm">
              Categories
            </div>
            {Object.keys(groupedTasks).map(category => (
              <div key={category} className="border-b border-cod-accent/30">
                <div className="h-6 p-1 font-bebas bg-cod-primary/80 text-cod-accent text-xs">{category}</div>
                {groupedTasks[category].map(task => (
                  <div key={task.id} className="h-10 border-b border-cod-accent/20 px-2 py-1 text-xs truncate flex items-center text-gray-300 hover:bg-cod-primary/50 transition-colors">
                    {task.name}
                  </div>
                ))}
              </div>
            ))}
          </div>
          
          <div className="flex-1" ref={timelineRef}>
            <div className="h-16 border-b border-cod-accent/30 bg-cod-primary">
              {renderTimelineHeader()}
            </div>
            
            {Object.keys(groupedTasks).map(category => (
              <div key={category} className="border-b border-cod-accent/30">
                <div className="h-6 bg-cod-primary/60"></div>
                {groupedTasks[category].map(task => {
                  const position = calculateTaskPosition(task);
                  if (!position) return null; // Task not visible
                  
                  return (
                    <div key={task.id} className="h-10 border-b border-cod-accent/20 relative">
                      <div className="absolute inset-0 flex">
                        {timelineDays.map((day, index) => (
                          <DroppableTimeline key={index} date={day}>
                            <div className="w-full h-full border-r border-cod-accent/10" />
                          </DroppableTimeline>
                        ))}
                      </div>
                      {onTaskMove ? (
                        <DraggableTaskBar
                          task={task}
                          left={position.left}
                          width={position.width}
                          players={players}
                          onClick={() => onTaskClick?.(task)}
                        />
                      ) : (
                        <TaskBar
                          task={task}
                          left={position.left}
                          width={position.width}
                          players={players}
                          onClick={() => onTaskClick?.(task)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
            
            {/* Task Dependencies Overlay */}
            <TaskDependencies
              tasks={tasks}
              visibleTasks={visibleTasks}
              calculateTaskPosition={calculateTaskPosition}
            />
          </div>
        </div>
      </div>
      
      <DragOverlay dropAnimation={null}>
        {activeTask && (
          <div className="bg-gray-700 text-white px-2 py-1 rounded shadow-lg text-xs">
            {activeTask.name}
          </div>
        )}
        {draggedUnit && (
          <div className="bg-cod-primary text-cod-accent px-3 py-2 rounded shadow-lg border-2 border-cod-accent animate-pulse">
            <div className="text-lg text-center">{draggedUnit.icon}</div>
            <div className="text-xs font-bebas">{draggedUnit.name}</div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};