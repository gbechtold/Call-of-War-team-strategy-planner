import React, { useRef } from 'react';
import { DndContext, type DragEndEvent, DragOverlay, MouseSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
import { type Task, type Unit } from '../../types';
import { format, addDays, differenceInDays, isSameDay } from 'date-fns';
import { FaPlus, FaMinus, FaUndo } from 'react-icons/fa';
import { DraggableTaskBar } from './DraggableTaskBar';
import { TaskBar } from './TaskBar';
import { TaskDependencies } from '../TaskDependencies/TaskDependencies';
import { useStrategyStore } from '../../store/useStrategyStore';
import { getCountryFlag } from '../../utils/countryFlags';

interface Milestone {
  id: string;
  name: string;
  description: string;
  date: Date;
  color: string;
  strategyId: string;
}

interface GanttChartProps {
  tasks: Task[];
  startDate: Date;
  endDate: Date;
  onTaskClick?: (task: Task) => void;
  onTaskMove?: (taskId: string, newStartDate: Date, newEndDate: Date, newCategory?: string) => void;
  onUnitDrop?: (unit: Unit, dropDate: Date) => void;
  onCategoryRename?: (oldCategory: string, newCategory: string) => void;
}

interface DroppableTimelineProps {
  date: Date;
  children: React.ReactNode;
  columnWidth: number;
}

interface DroppableTaskRowProps {
  taskId: string;
  category: string;
  children: React.ReactNode;
}

const DroppableTimeline: React.FC<DroppableTimelineProps> = ({ date, children, columnWidth }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `timeline-${date.toISOString()}`,
    data: { date }
  });

  return (
    <div
      ref={setNodeRef}
      className={`h-full flex-shrink-0 ${isOver ? 'bg-cod-accent/20' : ''} transition-colors`}
      style={{ minWidth: `${columnWidth}px` }}
    >
      {children}
    </div>
  );
};

const DroppableTaskRow: React.FC<DroppableTaskRowProps> = ({ taskId, category, children }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `task-row-${taskId}`,
    data: { taskId, category, type: 'task-row' }
  });

  return (
    <div
      ref={setNodeRef}
      className={`relative ${isOver ? 'bg-cod-accent/10 ring-2 ring-cod-accent/30' : ''} transition-all`}
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
  onUnitDrop,
  onCategoryRename
}) => {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [draggedUnit, setDraggedUnit] = React.useState<Unit | null>(null);
  const [windowWidth, setWindowWidth] = React.useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [editingCategory, setEditingCategory] = React.useState<string | null>(null);
  const [categoryNewName, setCategoryNewName] = React.useState<string>('');
  const [milestones, setMilestones] = React.useState<Milestone[]>([]);
  const [zoomLevel, setZoomLevel] = React.useState<number>(1); // 1 = 100%, 0.5 = 50%, 2 = 200%
  const timelineRef = useRef<HTMLDivElement>(null);
  
  // Listen for window resize to update column width
  React.useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Extended timeline - show 7 days into future from end date (reduced from 30)
  const extendedEndDate = addDays(endDate, 7);
  const totalDays = differenceInDays(extendedEndDate, startDate) + 1;
  
  // Responsive column width - mobile-friendly sizing
  const getColumnWidth = () => {
    const isMobile = windowWidth < 768;
    const sidebarWidth = isMobile ? 0 : 400; // No sidebar on mobile
    const containerWidth = windowWidth - sidebarWidth - (isMobile ? 32 : 48); // Account for padding
    
    // Mobile: wider columns for touch, Desktop: optimized width
    const minWidth = isMobile ? 60 : 40;
    const maxWidth = isMobile ? 120 : 80;
    const calculatedWidth = Math.max(minWidth, Math.min(maxWidth, containerWidth / totalDays));
    return Math.floor(calculatedWidth);
  };
  
  const columnWidth = Math.floor(getColumnWidth() * zoomLevel);
  
  const { players, currentStrategyId, strategies } = useStrategyStore();
  const currentStrategy = strategies.find(s => s.id === currentStrategyId);
  
  // Load milestones for current strategy
  React.useEffect(() => {
    const loadMilestones = () => {
      if (!currentStrategy) {
        setMilestones([]);
        return;
      }
      
      const storageKey = `milestones-${currentStrategy.id}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const withDates = parsed.map((m: any) => ({
            ...m,
            date: new Date(m.date)
          }));
          setMilestones(withDates);
        } catch (error) {
          console.error('Error loading milestones:', error);
          setMilestones([]);
        }
      } else {
        setMilestones([]);
      }
    };

    loadMilestones();

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `milestones-${currentStrategy?.id}`) {
        loadMilestones();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom event for same-window updates
    const handleMilestonesUpdate = () => loadMilestones();
    window.addEventListener('milestonesUpdated', handleMilestonesUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('milestonesUpdated', handleMilestonesUpdate);
    };
  }, [currentStrategy]);
  
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
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
    if (!active || !onTaskMove || active.data.current?.type === 'unit') {
      setActiveId(null);
      setDraggedUnit(null);
      return;
    }
    
    const task = tasks.find(t => t.id === active.id);
    if (!task) {
      setActiveId(null);
      return;
    }
    
    let newStartDate = new Date(task.startDate);
    let newEndDate = new Date(task.endDate);
    let newCategory = task.category;
    
    // Check if dropped on a task row (category change)
    if (over?.data.current?.type === 'task-row') {
      const targetCategory = over.data.current.category;
      // Allow moving to any category
      if (targetCategory) {
        newCategory = targetCategory;
      }
    }
    
    // Calculate time movement if there was horizontal drag
    if (delta && (Math.abs(delta.x) > 5 || Math.abs(delta.y) > 5)) {
      const dayWidth = columnWidth;
      const daysMoved = Math.round(delta.x / dayWidth);
      
      newStartDate = addDays(new Date(task.startDate), daysMoved);
      newEndDate = addDays(new Date(task.endDate), daysMoved);
    }
    
    // Allow tasks to be scheduled anywhere in the extended timeline
    if (newStartDate >= startDate && newEndDate <= extendedEndDate) {
      onTaskMove(task.id, newStartDate, newEndDate, newCategory !== task.category ? newCategory : undefined);
    }
    
    setActiveId(null);
    setDraggedUnit(null);
  };

  const handleCategoryClick = (category: string) => {
    setEditingCategory(category);
    setCategoryNewName(category);
  };

  const handleCategoryRename = (oldCategory: string) => {
    if (categoryNewName.trim() && categoryNewName !== oldCategory && onCategoryRename) {
      onCategoryRename(oldCategory, categoryNewName.trim());
    }
    setEditingCategory(null);
    setCategoryNewName('');
  };

  const handleCategoryKeyDown = (e: React.KeyboardEvent, oldCategory: string) => {
    if (e.key === 'Enter') {
      handleCategoryRename(oldCategory);
    } else if (e.key === 'Escape') {
      setEditingCategory(null);
      setCategoryNewName('');
    }
  };
  
  
  const renderTimelineHeader = () => {
    const headers = [];
    
    // Create day headers for all days
    for (let i = 0; i < totalDays; i++) {
      const currentDate = addDays(startDate, i);
      
      // Find milestone for this date
      const dayMilestone = milestones.find(m => isSameDay(m.date, currentDate));
      
      headers.push(
        <div 
          key={i} 
          className={`flex-shrink-0 text-center text-xs border-r border-cod-accent/20 p-1 relative`}
          style={{ 
            minWidth: `${columnWidth}px`,
            backgroundColor: dayMilestone ? `${dayMilestone.color}25` : undefined,
            backgroundImage: dayMilestone ? `linear-gradient(180deg, ${dayMilestone.color}15 0%, ${dayMilestone.color}35 100%)` : undefined
          }}
        >
          {/* Enhanced milestone indicator at top if milestone exists */}
          {dayMilestone && (
            <div 
              className="absolute top-0 left-0 right-0 h-2 rounded-t"
              style={{ backgroundColor: dayMilestone.color }}
              title={`Milestone: ${dayMilestone.name}`}
            />
          )}
          <div className={`font-bebas text-[10px] ${dayMilestone ? 'text-white font-bold' : 'text-cod-accent'}`}>
            {format(currentDate, 'EEE')}
          </div>
          <div className={`text-[10px] ${dayMilestone ? 'text-white font-bold' : 'text-gray-400'}`}>
            {format(currentDate, 'd')}
          </div>
          <div className={`text-[8px] ${dayMilestone ? 'text-white/80' : 'text-gray-500'}`}>
            {format(currentDate, 'MMM')}
          </div>
          {/* Enhanced milestone flag indicator if milestone exists */}
          {dayMilestone && (
            <div className="text-[10px] mt-1 animate-pulse" style={{ color: dayMilestone.color }}>
              🏁
            </div>
          )}
        </div>
      );
    }
    
    return (
      <div className="flex" style={{ minWidth: `${totalDays * columnWidth}px` }}>
        {headers}
      </div>
    );
  };
  
  const renderPlayerFlagsHeader = () => {
    const flagHeaders = [];
    
    // Create flag headers for all days
    for (let i = 0; i < totalDays; i++) {
      const currentDate = addDays(startDate, i);
      
      // Find milestone for this date
      const dayMilestone = milestones.find(m => isSameDay(m.date, currentDate));
      
      // Find players with tasks scheduled for this day
      const playersForDay = new Set<string>();
      tasks.forEach(task => {
        const taskStart = new Date(task.startDate);
        const taskEnd = new Date(task.endDate);
        if (currentDate >= taskStart && currentDate <= taskEnd) {
          task.assignedPlayers.forEach(playerId => {
            const player = players.find(p => p.id === playerId);
            if (player) {
              playersForDay.add(player.nation);
            }
          });
        }
      });
      
      const uniqueFlags = Array.from(playersForDay).map(nation => getCountryFlag(nation));
      
      flagHeaders.push(
        <div 
          key={i} 
          className="flex-shrink-0 text-center border-r border-cod-accent/20 p-1 h-8 flex items-center justify-center gap-1" 
          style={{ 
            minWidth: `${columnWidth}px`,
            backgroundColor: dayMilestone ? `${dayMilestone.color}20` : undefined
          }}
        >
          {uniqueFlags.slice(0, 3).map((flag, index) => (
            <span key={index} className="text-[10px]" title="Nations active this day">
              {flag}
            </span>
          ))}
          {uniqueFlags.length > 3 && (
            <span className="text-[8px] text-gray-400">+{uniqueFlags.length - 3}</span>
          )}
        </div>
      );
    }
    
    return (
      <div className="flex bg-cod-primary/40" style={{ minWidth: `${totalDays * columnWidth}px` }}>
        {flagHeaders}
      </div>
    );
  };
  
  const calculateTaskPosition = (task: Task) => {
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);
    
    // Calculate position with hour precision
    const startTime = taskStart.getTime();
    const endTime = taskEnd.getTime();
    const timelineStartTime = startDate.getTime();
    const timelineEndTime = extendedEndDate.getTime();
    
    // Calculate hours from timeline start
    const startHours = (startTime - timelineStartTime) / (1000 * 60 * 60);
    const endHours = (endTime - timelineStartTime) / (1000 * 60 * 60);
    const totalHours = (timelineEndTime - timelineStartTime) / (1000 * 60 * 60);
    
    // Only show tasks that are within the timeline bounds
    if (endHours < 0 || startHours >= totalHours) {
      return null; // Task not visible
    }
    
    const clampedStartHours = Math.max(0, startHours);
    const clampedEndHours = Math.min(totalHours, endHours);
    const durationHours = clampedEndHours - clampedStartHours;
    
    return {
      left: (clampedStartHours / totalHours) * 100,
      width: (durationHours / totalHours) * 100
    };
  };
  
  const groupedTasks = tasks.reduce((acc, task) => {
    const category = task.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(task);
    return acc;
  }, {} as Record<string, Task[]>);
  
  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;
  
  // Create timeline days for drop zones (all days)
  const timelineDays: Date[] = [];
  for (let i = 0; i < totalDays; i++) {
    timelineDays.push(addDays(startDate, i));
  }
  
  // Get all visible tasks for dependency visualization
  const visibleTasks = tasks.filter(task => calculateTaskPosition(task) !== null);
  
  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="bg-cod-secondary rounded-lg shadow-2xl border-2 border-cod-accent/20 max-h-[500px] md:max-h-[600px] flex flex-col">
        {/* Zoom Controls */}
        <div className="flex items-center justify-between px-4 py-2 bg-cod-primary border-b border-cod-accent/30">
          <div className="text-sm font-bebas text-cod-accent">Timeline View</div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Zoom:</span>
            <button
              onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))}
              className="px-2 py-1 bg-cod-secondary text-cod-accent rounded text-xs hover:bg-cod-accent hover:text-cod-primary transition-colors flex items-center"
              title="Zoom out"
            >
              <FaMinus />
            </button>
            <span className="text-xs text-cod-accent font-mono w-12 text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.25))}
              className="px-2 py-1 bg-cod-secondary text-cod-accent rounded text-xs hover:bg-cod-accent hover:text-cod-primary transition-colors flex items-center"
              title="Zoom in"
            >
              <FaPlus />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="px-2 py-1 bg-cod-secondary text-cod-accent rounded text-xs hover:bg-cod-accent hover:text-cod-primary transition-colors ml-2 flex items-center gap-1"
              title="Reset zoom"
            >
              <FaUndo className="text-[10px]" />
              <span>Reset</span>
            </button>
          </div>
        </div>
        
        <div className="flex flex-1 overflow-hidden">
          <div className="w-32 md:w-40 bg-cod-primary flex-shrink-0 overflow-y-auto">
            <div className="h-24 border-b border-cod-accent/30 p-1 md:p-2 font-bebas text-cod-accent flex items-end text-xs md:text-sm">
              Categories
            </div>
            {Object.keys(groupedTasks).map(category => (
              <div key={category} className="border-b border-cod-accent/30">
                <div className="h-6 p-1 font-bebas bg-cod-primary/80 text-cod-accent text-xs">
                  {editingCategory === category ? (
                    <input
                      type="text"
                      value={categoryNewName}
                      onChange={(e) => setCategoryNewName(e.target.value)}
                      onBlur={() => handleCategoryRename(category)}
                      onKeyDown={(e) => handleCategoryKeyDown(e, category)}
                      className="w-full bg-transparent border-b border-cod-accent outline-none text-xs"
                      autoFocus
                    />
                  ) : (
                    <div
                      className="cursor-pointer hover:text-cod-accent/70 transition-colors flex items-center gap-1"
                      onClick={() => handleCategoryClick(category)}
                      title="Click to rename category"
                    >
                      {category}
                      <span className="opacity-30 text-[8px]">✏️</span>
                    </div>
                  )}
                </div>
                {groupedTasks[category].map(task => (
                  <div key={task.id} className="h-10 border-b border-cod-accent/20 px-2 py-1 text-xs truncate flex items-center text-gray-300 hover:bg-cod-primary/50 transition-colors">
                    {task.name}
                  </div>
                ))}
              </div>
            ))}
          </div>
          
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-auto custom-scrollbar" ref={timelineRef}>
            <div className="h-24 border-b border-cod-accent/30 bg-cod-primary">
              <div className="h-16 border-b border-cod-accent/20">
                {renderTimelineHeader()}
              </div>
              {renderPlayerFlagsHeader()}
            </div>
            
            {Object.keys(groupedTasks).map(category => (
              <div key={category} className="border-b border-cod-accent/30">
                <div className="h-6 bg-cod-primary/60 relative" style={{ minWidth: `${totalDays * columnWidth}px` }}>
                  {/* Milestone indicators for category header */}
                  <div className="absolute inset-0 flex">
                    {timelineDays.map((day, index) => {
                      const dayMilestone = milestones.find(m => isSameDay(m.date, day));
                      return (
                        <div key={index} className="border-r border-cod-accent/10 relative" style={{ minWidth: `${columnWidth}px` }}>
                          {dayMilestone && (
                            <>
                              <div 
                                className="absolute bottom-0 left-0 right-0 h-1 opacity-40"
                                style={{ backgroundColor: dayMilestone.color }}
                              />
                              <div 
                                className="absolute inset-0 opacity-10"
                                style={{ backgroundColor: dayMilestone.color }}
                              />
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                {groupedTasks[category].map(task => {
                  const position = calculateTaskPosition(task);
                  if (!position) return null; // Task not visible
                  
                  return (
                    <DroppableTaskRow key={task.id} taskId={task.id} category={category}>
                      <div className="h-10 border-b border-cod-accent/20 relative" style={{ minWidth: `${totalDays * columnWidth}px` }}>
                        <div className="absolute inset-0 flex">
                          {timelineDays.map((day, index) => {
                            // Find milestone for this date
                            const dayMilestone = milestones.find(m => isSameDay(m.date, day));
                            
                            return (
                              <DroppableTimeline key={index} date={day} columnWidth={columnWidth}>
                                <div className="w-full h-full border-r border-cod-accent/10 relative">
                                  {/* Milestone background coloring */}
                                  {dayMilestone && (
                                    <>
                                      {/* Full background tint */}
                                      <div 
                                        className="absolute inset-0 opacity-8"
                                        style={{ backgroundColor: dayMilestone.color }}
                                      />
                                      {/* Bottom accent line */}
                                      <div 
                                        className="absolute bottom-0 left-0 right-0 h-1 opacity-40"
                                        style={{ backgroundColor: dayMilestone.color }}
                                      />
                                    </>
                                  )}
                                </div>
                              </DroppableTimeline>
                            );
                          })}
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
                    </DroppableTaskRow>
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