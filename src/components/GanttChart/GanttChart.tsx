import React from 'react';
import { DndContext, type DragEndEvent, DragOverlay, MouseSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
import { type Task, type Unit } from '../../types';
import { format, startOfWeek, addDays, differenceInDays, isWithinInterval } from 'date-fns';
import { DraggableTaskBar } from './DraggableTaskBar';
import { TaskBar } from './TaskBar';

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
      className={`h-full ${isOver ? 'bg-cod-accent/20' : ''}`}
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
  const totalDays = differenceInDays(endDate, startDate) + 1;
  const weeks = Math.ceil(totalDays / 7);
  
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
    } else {
      setActiveId(active.id as string);
    }
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta, over } = event;
    
    // Handle unit drop
    if (active.data.current?.type === 'unit' && over?.data.current?.date) {
      const unit = active.data.current.unit;
      const dropDate = over.data.current.date;
      onUnitDrop?.(unit, dropDate);
      setDraggedUnit(null);
      return;
    }
    
    // Handle task move
    if (!active || !delta || !onTaskMove) {
      setActiveId(null);
      setDraggedUnit(null);
      return;
    }
    
    const task = tasks.find(t => t.id === active.id);
    if (!task) {
      setActiveId(null);
      return;
    }
    
    // Calculate days moved based on drag distance
    const dayWidth = 100 / totalDays;
    const daysMoved = Math.round(delta.x / (window.innerWidth * dayWidth / 100));
    
    const newStartDate = addDays(new Date(task.startDate), daysMoved);
    const newEndDate = addDays(new Date(task.endDate), daysMoved);
    
    // Ensure dates stay within strategy bounds
    if (newStartDate >= startDate && newEndDate <= endDate) {
      onTaskMove(task.id, newStartDate, newEndDate);
    }
    
    setActiveId(null);
    setDraggedUnit(null);
  };
  
  const renderTimelineHeader = () => {
    const headers = [];
    const weekStart = startOfWeek(startDate, { weekStartsOn: 1 });
    
    for (let week = 0; week < weeks; week++) {
      const weekDates = [];
      for (let day = 0; day < 7; day++) {
        const currentDate = addDays(weekStart, week * 7 + day);
        if (isWithinInterval(currentDate, { start: startDate, end: endDate })) {
          weekDates.push(
            <div key={`${week}-${day}`} className="flex-1 text-center text-xs border-r border-gray-300 p-1">
              <div className="font-semibold">{format(currentDate, 'EEE')}</div>
              <div className="text-gray-600">{format(currentDate, 'd')}</div>
            </div>
          );
        }
      }
      
      if (weekDates.length > 0) {
        headers.push(
          <div key={week} className="flex flex-col">
            <div className="text-center font-bold p-2 border-b border-gray-300 bg-cod-primary text-cod-accent">
              Week {week + 1} - {format(addDays(weekStart, week * 7), 'MMM yyyy')}
            </div>
            <div className="flex">
              {weekDates}
            </div>
          </div>
        );
      }
    }
    
    return headers;
  };
  
  const calculateTaskPosition = (task: Task) => {
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);
    
    const startOffset = Math.max(0, differenceInDays(taskStart, startDate));
    const endOffset = Math.min(totalDays, differenceInDays(taskEnd, startDate) + 1);
    const duration = endOffset - startOffset;
    
    return {
      left: (startOffset / totalDays) * 100,
      width: (duration / totalDays) * 100
    };
  };
  
  const groupedTasks = tasks.reduce((acc, task) => {
    const category = task.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(task);
    return acc;
  }, {} as Record<string, Task[]>);
  
  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;
  
  // Create timeline days for drop zones
  const timelineDays: Date[] = [];
  for (let i = 0; i < totalDays; i++) {
    timelineDays.push(addDays(startDate, i));
  }
  
  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="bg-cod-secondary rounded-lg shadow-2xl overflow-hidden border-2 border-cod-accent/20">
        <div className="flex">
          <div className="w-48 bg-cod-primary">
            <div className="h-24 border-b border-cod-accent/30 p-2 font-bebas text-cod-accent flex items-end text-xl">
              Task Categories
            </div>
            {Object.keys(groupedTasks).map(category => (
              <div key={category} className="border-b border-cod-accent/30">
                <div className="h-8 p-2 font-bebas bg-cod-primary/80 text-cod-accent">{category}</div>
                {groupedTasks[category].map(task => (
                  <div key={task.id} className="h-12 border-b border-cod-accent/20 px-2 py-1 text-sm truncate flex items-center text-gray-300 hover:bg-cod-primary/50 transition-colors">
                    {task.name}
                  </div>
                ))}
              </div>
            ))}
          </div>
          
          <div className="flex-1 overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="h-24 border-b border-cod-accent/30 flex">
                {renderTimelineHeader()}
              </div>
              
              {Object.keys(groupedTasks).map(category => (
                <div key={category} className="border-b border-cod-accent/30">
                  <div className="h-8 bg-cod-primary/60"></div>
                  {groupedTasks[category].map(task => {
                    const position = calculateTaskPosition(task);
                    return (
                      <div key={task.id} className="h-12 border-b border-cod-accent/20 relative">
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
                            onClick={() => onTaskClick?.(task)}
                          />
                        ) : (
                          <TaskBar
                            task={task}
                            left={position.left}
                            width={position.width}
                            onClick={() => onTaskClick?.(task)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <DragOverlay>
        {activeTask && (
          <div className="bg-gray-700 text-white px-3 py-1 rounded shadow-lg">
            {activeTask.name}
          </div>
        )}
        {draggedUnit && (
          <div className="bg-cod-primary text-cod-accent px-4 py-2 rounded shadow-lg border-2 border-cod-accent animate-pulse">
            <div className="text-2xl text-center">{draggedUnit.icon}</div>
            <div className="text-sm font-bebas">{draggedUnit.name}</div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};