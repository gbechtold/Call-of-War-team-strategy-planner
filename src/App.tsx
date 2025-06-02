import { useEffect, useState, useRef } from 'react';
import { DndContext } from '@dnd-kit/core';
import { GanttChart } from './components/GanttChart';
import { TaskForm } from './components/TaskForm/TaskForm';
import { Modal } from './components/Modal/Modal';
import { UnitMenu } from './components/UnitMenu/UnitMenu';
import { PlayerManager } from './components/PlayerManager/PlayerManager';
import { ShareDialog } from './components/StrategySharing/ShareDialog';
import { StrategyNotes } from './components/StrategyNotes';
import { AutoPlan } from './components/AutoPlan';
import { Milestones } from './components/Milestones';
import { RevisionHistory } from './components/RevisionHistory';
import { ShortcutTooltip } from './components/KeyboardShortcuts/ShortcutTooltip';
import { ShortcutHelp } from './components/KeyboardShortcuts/ShortcutHelp';
import { MobileSwipeHandler } from './components/SwipeNavigation/MobileSwipeHandler';
import { useKeyboardShortcuts, type KeyboardShortcut } from './hooks/useKeyboardShortcuts';
import { useMobilePanels, type Panel } from './hooks/useMobilePanels';
import { useIsMobile } from './hooks/useSwipeGestures';
import { useStrategyStore } from './store/useStrategyStore';
import { useCurrentStrategy } from './hooks/useCurrentStrategy';
import { type Task, type Unit, TaskType, TaskStatus } from './types';
import { addDays, addHours } from 'date-fns';
import { FaPlus, FaBars, FaPen, FaStickyNote, FaRocket, FaFlag, FaTimes, FaKeyboard } from 'react-icons/fa';
import { getUnitBuildDuration } from './data/units';
import './App.css';

function App() {
  const { createStrategy, createTask, updateTask, updateStrategy, deleteTask } = useStrategyStore();
  const { strategy, tasks } = useCurrentStrategy();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [showUnitMenu, setShowUnitMenu] = useState(true);
  const [showPlayerManager, setShowPlayerManager] = useState(true);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showAutoPlan, setShowAutoPlan] = useState(false);
  const [showMilestones, setShowMilestones] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [editingStrategyName, setEditingStrategyName] = useState(false);
  const [strategyName, setStrategyName] = useState('');
  const [showDeleteTaskConfirm, setShowDeleteTaskConfirm] = useState(false);
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);
  
  // Mobile panel management
  const isMobile = useIsMobile();
  const mobilePanels: Panel[] = [
    { id: 'units', name: 'Units', component: () => null, icon: '🔧' },
    { id: 'players', name: 'Alliance', component: () => null, icon: '👥' },
    { id: 'notes', name: 'Notes', component: () => null, icon: '📝' },
    { id: 'autoplan', name: 'Auto-Plan', component: () => null, icon: '🚀' },
    { id: 'milestones', name: 'Milestones', component: () => null, icon: '🏁' },
    { id: 'history', name: 'History', component: () => null, icon: '📖' }
  ];
  
  const {
    isAnyPanelOpen,
    handlePanelSwipe,
    getCurrentPanel,
    isPanelOpen,
    openPanel,
    closeAllPanels
  } = useMobilePanels(mobilePanels);
  
  // Timeline navigation state for mobile
  const [, setTimelineOffset] = useState(0);
  
  // Refs for auto-scrolling sidebar components
  const unitMenuRef = useRef<HTMLDivElement>(null);
  const playerManagerRef = useRef<HTMLDivElement>(null);
  const notesRef = useRef<HTMLDivElement>(null);
  const autoPlanRef = useRef<HTMLDivElement>(null);
  const milestonesRef = useRef<HTMLDivElement>(null);
  
  // Check for shared strategy in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedData = urlParams.get('shared');
    
    if (sharedData && !strategy) {
      try {
        const decoded = JSON.parse(atob(sharedData));
        
        // Create the shared strategy
        const sharedStrategy = {
          ...decoded.strategy,
          name: `${decoded.strategy.name} (Shared)`,
          createdAt: new Date(),
          updatedAt: new Date(),
          startDate: new Date(decoded.strategy.startDate),
          endDate: new Date(decoded.strategy.endDate)
        };
        
        createStrategy(sharedStrategy);
        
        // Import tasks
        if (decoded.tasks) {
          decoded.tasks.forEach((task: any) => {
            createTask({
              ...task,
              strategyId: sharedStrategy.id,
              startDate: new Date(task.startDate),
              endDate: new Date(task.endDate)
            });
          });
        }
        
        // Clear URL parameter after loading
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      } catch (error) {
        console.error('Failed to load shared strategy:', error);
      }
    }
    
    // Initialize with demo data if no shared strategy
    if (!strategy) {
      createStrategy({
        name: 'Operation Thunder Strike',
        description: 'Coordinated offensive against eastern territories',
        startDate: new Date(),
        endDate: addDays(new Date(), 30),
        players: [],
        tasks: []
      });
    }
  }, [strategy, createStrategy, createTask]);
  
  // Add demo tasks if none exist
  useEffect(() => {
    if (strategy && tasks.length === 0) {
      const demoTasks = [
        {
          name: 'Train Infantry Units',
          description: 'Produce 10 infantry units',
          type: TaskType.UNIT_PRODUCTION,
          status: TaskStatus.IN_PROGRESS,
          category: 'Unit Production',
          startDate: new Date(),
          endDate: addDays(new Date(), 3),
          strategyId: strategy.id,
          assignedPlayers: [],
          dependencies: [],
          priority: 1
        },
        {
          name: 'Research Artillery',
          description: 'Unlock advanced artillery units',
          type: TaskType.RESEARCH,
          status: TaskStatus.PENDING,
          category: 'Research',
          startDate: addDays(new Date(), 2),
          endDate: addDays(new Date(), 7),
          strategyId: strategy.id,
          assignedPlayers: [],
          dependencies: [],
          priority: 2
        }
      ];
      
      demoTasks.forEach(task => createTask(task));
    }
  }, [strategy, tasks, createTask]);
  
  const handleTaskSubmit = (taskData: Omit<Task, 'id'>) => {
    if (editingTask) {
      updateTask(editingTask.id, taskData);
    } else {
      createTask(taskData);
    }
    setIsModalOpen(false);
    setEditingTask(undefined);
  };
  
  const handleTaskClick = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };
  
  const handleNewTask = () => {
    setEditingTask(undefined);
    setIsModalOpen(true);
  };
  
  const handleDeleteTask = () => {
    setShowDeleteTaskConfirm(true);
  };
  
  const confirmDeleteTask = () => {
    if (editingTask) {
      deleteTask(editingTask.id);
      setIsModalOpen(false);
      setEditingTask(undefined);
    }
    setShowDeleteTaskConfirm(false);
  };
  
  const cancelDeleteTask = () => {
    setShowDeleteTaskConfirm(false);
  };
  
  // Auto-scroll helper function
  const scrollToComponent = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest',
        inline: 'nearest' 
      });
    }
  };

  // Keyboard shortcuts definition
  const keyboardShortcuts: KeyboardShortcut[] = [
    // General Actions
    {
      key: 'n',
      ctrlKey: true,
      description: 'Add New Task',
      action: handleNewTask,
      category: 'General'
    },
    {
      key: 's',
      ctrlKey: true,
      description: 'Save Strategy',
      action: () => {
        if (strategy) {
          updateStrategy(strategy.id, { updatedAt: new Date() });
        }
      },
      category: 'General'
    },
    {
      key: '?',
      description: 'Show Keyboard Shortcuts',
      action: () => setShowShortcutHelp(true),
      category: 'General'
    },
    {
      key: 'Escape',
      description: 'Close Dialogs',
      action: () => {
        setIsModalOpen(false);
        setShowShareDialog(false);
        setShowShortcutHelp(false);
        setEditingTask(undefined);
      },
      category: 'General'
    },
    // Panel Navigation
    {
      key: 'u',
      altKey: true,
      description: 'Toggle Units Panel',
      action: () => {
        setShowUnitMenu(!showUnitMenu);
        setTimeout(() => scrollToComponent(unitMenuRef), 100);
      },
      category: 'Navigation'
    },
    {
      key: 'p',
      altKey: true,
      description: 'Toggle Players Panel',
      action: () => {
        setShowPlayerManager(!showPlayerManager);
        setTimeout(() => scrollToComponent(playerManagerRef), 100);
      },
      category: 'Navigation'
    },
    {
      key: 'h',
      altKey: true,
      description: 'Toggle Share Dialog',
      action: () => setShowShareDialog(!showShareDialog),
      category: 'Navigation'
    },
    {
      key: 'o',
      altKey: true,
      description: 'Toggle Notes Panel',
      action: () => {
        setShowNotes(!showNotes);
        setTimeout(() => scrollToComponent(notesRef), 100);
      },
      category: 'Navigation'
    },
    {
      key: 'a',
      altKey: true,
      description: 'Toggle Auto-Plan Panel',
      action: () => {
        setShowAutoPlan(!showAutoPlan);
        setTimeout(() => scrollToComponent(autoPlanRef), 100);
      },
      category: 'Navigation'
    },
    {
      key: 'm',
      altKey: true,
      description: 'Toggle Milestones Panel',
      action: () => {
        setShowMilestones(!showMilestones);
        setTimeout(() => scrollToComponent(milestonesRef), 100);
      },
      category: 'Navigation'
    },
    {
      key: 'i',
      altKey: true,
      description: 'Toggle History Panel',
      action: () => setShowHistory(!showHistory),
      category: 'Navigation'
    },
    // Quick Actions
    {
      key: 'e',
      ctrlKey: true,
      description: 'Edit Strategy Name',
      action: () => {
        setStrategyName(strategy?.name || '');
        setEditingStrategyName(true);
      },
      category: 'Quick Actions'
    },
    {
      key: 'Delete',
      description: 'Delete Selected Task',
      action: () => {
        if (editingTask) {
          setShowDeleteTaskConfirm(true);
        }
      },
      category: 'Quick Actions'
    }
  ];

  // Initialize keyboard shortcuts
  useKeyboardShortcuts(keyboardShortcuts, true);
  
  // Panel handling functions for mobile vs desktop
  const handlePanelToggle = (panelId: string, desktopToggleFn: () => void) => {
    if (isMobile) {
      if (isPanelOpen(panelId)) {
        closeAllPanels();
      } else {
        openPanel(panelId);
      }
    } else {
      desktopToggleFn();
    }
  };
  
  // Timeline navigation for mobile swipes
  const handleTimelineSwipe = (direction: 'up' | 'down') => {
    if (direction === 'up') {
      setTimelineOffset(prev => Math.max(prev - 7, -30)); // Navigate backward
    } else {
      setTimelineOffset(prev => Math.min(prev + 7, 30)); // Navigate forward  
    }
  };
  
  // Timeline zoom for mobile pinch
  const handleTimelineZoom = (scale: number) => {
    // For now, we'll just trigger a visual feedback
    console.log('Timeline zoom:', scale);
  };
  
  const handleTaskMove = (taskId: string, newStartDate: Date, newEndDate: Date, newCategory?: string) => {
    const updateData: Partial<Task> = { startDate: newStartDate, endDate: newEndDate };
    if (newCategory) {
      updateData.category = newCategory;
    }
    updateTask(taskId, updateData);
  };

  const handleCategoryRename = (oldCategory: string, newCategory: string) => {
    // Update all tasks in the old category to use the new category name
    tasks.forEach(task => {
      if (task.category === oldCategory) {
        updateTask(task.id, { category: newCategory });
      }
    });
  };
  
  const handleUnitDrop = (unit: Unit, dropDate: Date) => {
    const buildDuration = getUnitBuildDuration(unit);
    // Use unit name as category to group similar units together
    const unitCategory = `${unit.name} Production`;
    
    createTask({
      name: `Build ${unit.name}`,
      description: `Production time: ${unit.buildTime} minutes`,
      type: TaskType.UNIT_PRODUCTION,
      status: TaskStatus.PENDING,
      category: unitCategory,
      startDate: dropDate,
      endDate: addHours(dropDate, buildDuration),
      strategyId: strategy!.id,
      assignedPlayers: [],
      dependencies: [],
      priority: 2,
      unitId: unit.id
    });
  };

  const handleUnitClick = (unit: Unit) => {
    const buildDuration = getUnitBuildDuration(unit);
    
    // Use unit name as category to group similar units together
    const unitCategory = `${unit.name} Production`;
    const categoryTasks = tasks.filter(task => 
      task.category === unitCategory && task.strategyId === strategy!.id
    ).sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
    
    // Start after the latest task in this category, or today if no tasks exist
    const latestEndDate = categoryTasks.length > 0 ? new Date(categoryTasks[0].endDate) : new Date();
    const startDate = categoryTasks.length > 0 ? latestEndDate : new Date();
    
    createTask({
      name: `Build ${unit.name}`,
      description: `Production time: ${unit.buildTime} minutes`,
      type: TaskType.UNIT_PRODUCTION,
      status: TaskStatus.PENDING,
      category: unitCategory,
      startDate: startDate,
      endDate: addHours(startDate, buildDuration),
      strategyId: strategy!.id,
      assignedPlayers: [],
      dependencies: [],
      priority: 2,
      unitId: unit.id
    });
  };
  
  if (!strategy) {
    return <div className="flex items-center justify-center h-screen bg-cod-secondary">
      <div className="text-cod-accent font-bebas text-3xl animate-pulse">Loading Strategy...</div>
    </div>;
  }
  
  return (
    <DndContext>
      <div className="h-screen flex flex-col bg-cod-secondary">
        <header className="bg-cod-primary text-white p-3 shadow-2xl border-b-4 border-cod-accent relative">
          <div className="absolute -top-8 right-2 text-xs text-gray-600 opacity-50">
            v1.3.0 • {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bebas text-cod-accent tracking-wider">Call of War Strategy Planner</h1>
              {editingStrategyName ? (
                <input
                  type="text"
                  value={strategyName}
                  onChange={(e) => setStrategyName(e.target.value)}
                  onBlur={() => {
                    if (strategyName.trim() && strategyName !== strategy.name) {
                      updateStrategy(strategy.id, { name: strategyName.trim() });
                    }
                    setEditingStrategyName(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (strategyName.trim() && strategyName !== strategy.name) {
                        updateStrategy(strategy.id, { name: strategyName.trim() });
                      }
                      setEditingStrategyName(false);
                    } else if (e.key === 'Escape') {
                      setStrategyName(strategy.name);
                      setEditingStrategyName(false);
                    }
                  }}
                  className="text-gray-300 text-sm bg-transparent border-b border-cod-accent outline-none"
                  autoFocus
                />
              ) : (
                <p
                  className="text-gray-300 text-sm cursor-pointer hover:text-cod-accent transition-colors flex items-center gap-1"
                  onClick={() => {
                    setStrategyName(strategy.name);
                    setEditingStrategyName(true);
                  }}
                  title="Click to edit strategy name"
                >
                  {strategy.name}
                  <FaPen className="text-xs opacity-30 hover:opacity-100 transition-opacity" />
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <ShortcutTooltip shortcut={keyboardShortcuts.find(s => s.key === 'u' && s.altKey)}>
                <button
                  onClick={() => handlePanelToggle('units', () => {
                    setShowUnitMenu(!showUnitMenu);
                    setTimeout(() => scrollToComponent(unitMenuRef), 100);
                  })}
                  className="flex items-center justify-center gap-1 px-3 py-2 md:px-2 md:py-1 bg-cod-secondary border-2 border-cod-accent text-cod-accent rounded-md hover:bg-cod-accent hover:text-cod-primary transition-all font-bebas text-sm md:text-xs"
                >
                  <FaBars /> Units
                </button>
              </ShortcutTooltip>
              <ShortcutTooltip shortcut={keyboardShortcuts.find(s => s.key === 'p' && s.altKey)}>
                <button
                  onClick={() => handlePanelToggle('players', () => {
                    setShowPlayerManager(!showPlayerManager);
                    setTimeout(() => scrollToComponent(playerManagerRef), 100);
                  })}
                  className="flex items-center justify-center gap-1 px-3 py-2 md:px-2 md:py-1 bg-cod-secondary border-2 border-cod-accent text-cod-accent rounded-md hover:bg-cod-accent hover:text-cod-primary transition-all font-bebas text-sm md:text-xs"
                >
                  👥 Alliance
                </button>
              </ShortcutTooltip>
              <ShortcutTooltip shortcut={keyboardShortcuts.find(s => s.key === 'h' && s.altKey)}>
                <button
                  onClick={() => setShowShareDialog(true)}
                  className="flex items-center justify-center gap-1 px-3 py-2 md:px-2 md:py-1 bg-cod-secondary border-2 border-cod-accent text-cod-accent rounded-md hover:bg-cod-accent hover:text-cod-primary transition-all font-bebas text-sm md:text-xs"
                >
                  🔗 Share
                </button>
              </ShortcutTooltip>
              <ShortcutTooltip shortcut={keyboardShortcuts.find(s => s.key === 'o' && s.altKey)}>
                <button
                  onClick={() => handlePanelToggle('notes', () => {
                    setShowNotes(!showNotes);
                    setTimeout(() => scrollToComponent(notesRef), 100);
                  })}
                  className="flex items-center justify-center gap-1 px-3 py-2 md:px-2 md:py-1 bg-cod-secondary border-2 border-cod-accent text-cod-accent rounded-md hover:bg-cod-accent hover:text-cod-primary transition-all font-bebas text-sm md:text-xs"
                >
                  <FaStickyNote /> Notes
                </button>
              </ShortcutTooltip>
              <ShortcutTooltip shortcut={keyboardShortcuts.find(s => s.key === 'a' && s.altKey)}>
                <button
                  onClick={() => handlePanelToggle('autoplan', () => {
                    setShowAutoPlan(!showAutoPlan);
                    setTimeout(() => scrollToComponent(autoPlanRef), 100);
                  })}
                  className="flex items-center justify-center gap-1 px-3 py-2 md:px-2 md:py-1 bg-cod-secondary border-2 border-cod-accent text-cod-accent rounded-md hover:bg-cod-accent hover:text-cod-primary transition-all font-bebas text-sm md:text-xs"
                >
                  <FaRocket /> Auto-Plan
                </button>
              </ShortcutTooltip>
              <ShortcutTooltip shortcut={keyboardShortcuts.find(s => s.key === 'm' && s.altKey)}>
                <button
                  onClick={() => handlePanelToggle('milestones', () => {
                    setShowMilestones(!showMilestones);
                    setTimeout(() => scrollToComponent(milestonesRef), 100);
                  })}
                  className="flex items-center justify-center gap-1 px-3 py-2 md:px-2 md:py-1 bg-cod-secondary border-2 border-cod-accent text-cod-accent rounded-md hover:bg-cod-accent hover:text-cod-primary transition-all font-bebas text-sm md:text-xs"
                >
                  <FaFlag /> Milestones
                </button>
              </ShortcutTooltip>
              <ShortcutTooltip shortcut={keyboardShortcuts.find(s => s.key === 'i' && s.altKey)}>
                <button
                  onClick={() => handlePanelToggle('history', () => setShowHistory(!showHistory))}
                  className="flex items-center justify-center gap-1 px-3 py-2 md:px-2 md:py-1 bg-cod-secondary border-2 border-cod-accent text-cod-accent rounded-md hover:bg-cod-accent hover:text-cod-primary transition-all font-bebas text-sm md:text-xs"
                >
                  📖 History
                </button>
              </ShortcutTooltip>
              
              {/* Keyboard Shortcuts Help */}
              <ShortcutTooltip shortcut={keyboardShortcuts.find(s => s.key === '?')}>
                <button
                  onClick={() => setShowShortcutHelp(true)}
                  className="flex items-center justify-center gap-1 px-3 py-2 md:px-2 md:py-1 bg-cod-secondary border-2 border-cod-accent text-cod-accent rounded-md hover:bg-cod-accent hover:text-cod-primary transition-all font-bebas text-sm md:text-xs"
                >
                  <FaKeyboard /> Help
                </button>
              </ShortcutTooltip>
              
              {/* Desktop: Add Task button */}
              <ShortcutTooltip shortcut={keyboardShortcuts.find(s => s.key === 'n' && s.ctrlKey)}>
                <button
                  onClick={handleNewTask}
                  className="hidden md:flex items-center gap-2 px-4 py-2 bg-cod-accent text-cod-primary rounded-md hover:bg-cod-accent/90 transition-all font-bebas text-lg"
                >
                  <FaPlus /> Add Task
                </button>
              </ShortcutTooltip>
            </div>
          </div>
        </header>
        
        <MobileSwipeHandler
          onPanelSwipe={handlePanelSwipe}
          onTimelineSwipe={handleTimelineSwipe}
          onTimelineZoom={handleTimelineZoom}
          enableHints={true}
          className="flex-1 overflow-hidden"
        >
          <main className="h-full p-2 md:p-3 flex flex-col lg:flex-row gap-2 md:gap-3 overflow-hidden">
            {/* Desktop: Sidebar panels */}
            <div className={`
              lg:flex lg:flex-col lg:gap-3 lg:overflow-y-auto lg:max-h-full lg:flex-shrink-0
              ${(isMobile && isAnyPanelOpen) || (!isMobile && (showUnitMenu || showPlayerManager || showNotes || showAutoPlan || showMilestones || showHistory))
                ? 'fixed inset-0 z-40 bg-cod-secondary/95 backdrop-blur-sm lg:static lg:bg-transparent lg:backdrop-blur-none p-4 lg:p-0 overflow-y-auto'
                : 'hidden lg:flex'
              }
            `}>
              {/* Mobile close button and panel indicator */}
              <div className="lg:hidden flex justify-between items-center mb-4 p-2 bg-cod-primary rounded-lg">
                <div>
                  <h2 className="text-cod-accent font-bebas text-xl">Command Panel</h2>
                  {isMobile && getCurrentPanel() && (
                    <p className="text-gray-400 text-sm">
                      {getCurrentPanel()?.icon} {getCurrentPanel()?.name}
                      <span className="ml-2 text-xs">Swipe ← → to navigate</span>
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    if (isMobile) {
                      closeAllPanels();
                    } else {
                      setShowUnitMenu(false);
                      setShowPlayerManager(false);
                      setShowNotes(false);
                      setShowAutoPlan(false);
                      setShowMilestones(false);
                      setShowHistory(false);
                    }
                  }}
                  className="text-cod-accent hover:text-cod-accent/70 p-2"
                >
                  <FaTimes size={20} />
                </button>
              </div>

              {/* Mobile: Show current panel only */}
              {isMobile ? (
                <>
                  {isPanelOpen('units') && (
                    <div ref={unitMenuRef} className="animate-fadeIn">
                      <UnitMenu onUnitClick={handleUnitClick} />
                    </div>
                  )}
                  {isPanelOpen('players') && (
                    <div ref={playerManagerRef} className="animate-fadeIn">
                      <PlayerManager />
                    </div>
                  )}
                  {isPanelOpen('notes') && (
                    <div ref={notesRef} className="animate-fadeIn">
                      <StrategyNotes />
                    </div>
                  )}
                  {isPanelOpen('autoplan') && (
                    <div ref={autoPlanRef} className="animate-fadeIn">
                      <AutoPlan />
                    </div>
                  )}
                  {isPanelOpen('milestones') && (
                    <div ref={milestonesRef} className="animate-fadeIn">
                      <Milestones />
                    </div>
                  )}
                  {isPanelOpen('history') && (
                    <div className="animate-fadeIn">
                      <RevisionHistory />
                    </div>
                  )}
                </>
              ) : (
                /* Desktop: Show all panels simultaneously */
                <>
                  {showUnitMenu && (
                    <div ref={unitMenuRef} className="animate-fadeIn">
                      <UnitMenu onUnitClick={handleUnitClick} />
                    </div>
                  )}
                  {showPlayerManager && (
                    <div ref={playerManagerRef} className="animate-fadeIn">
                      <PlayerManager />
                    </div>
                  )}
                  {showNotes && (
                    <div ref={notesRef} className="animate-fadeIn">
                      <StrategyNotes />
                    </div>
                  )}
                  {showAutoPlan && (
                    <div ref={autoPlanRef} className="animate-fadeIn">
                      <AutoPlan />
                    </div>
                  )}
                  {showMilestones && (
                    <div ref={milestonesRef} className="animate-fadeIn">
                      <Milestones />
                    </div>
                  )}
                  {showHistory && (
                    <div className="animate-fadeIn">
                      <RevisionHistory />
                    </div>
                  )}
                </>
              )}
          </div>
          
          <div className="flex-1 flex flex-col min-h-0">
            <div className="mb-2 px-2 lg:px-0">
              <h2 className="text-lg md:text-xl font-bebas text-cod-accent">Strategy Timeline</h2>
              <p className="text-gray-400 text-xs md:text-sm">{strategy.description}</p>
            </div>
            
            <GanttChart
              tasks={tasks}
              startDate={strategy.startDate}
              endDate={strategy.endDate}
              onTaskClick={handleTaskClick}
              onTaskMove={handleTaskMove}
              onUnitDrop={handleUnitDrop}
              onCategoryRename={handleCategoryRename}
            />
          </div>
          </main>
        </MobileSwipeHandler>
        
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingTask(undefined);
          }}
          title={editingTask ? 'Edit Task' : 'Create New Task'}
        >
          <TaskForm
            task={editingTask}
            strategyId={strategy.id}
            onSubmit={handleTaskSubmit}
            onCancel={() => {
              setIsModalOpen(false);
              setEditingTask(undefined);
            }}
            onDelete={editingTask ? handleDeleteTask : undefined}
          />
        </Modal>
        
        {/* Delete Task Confirmation Popup */}
        {showDeleteTaskConfirm && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen p-4">
              <div className="fixed inset-0 bg-black opacity-75" onClick={cancelDeleteTask}></div>
              
              <div className="relative bg-cod-primary border-2 border-cod-accent rounded-lg shadow-2xl max-w-md w-full animate-fadeIn">
                <div className="flex items-center justify-between p-4 border-b border-cod-accent/30">
                  <h3 className="text-2xl font-bebas text-cod-accent">Delete Task</h3>
                  <button
                    onClick={cancelDeleteTask}
                    className="text-cod-accent hover:text-cod-accent/70 focus:outline-none transition-colors"
                  >
                    <FaTimes className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="p-6 bg-cod-secondary/50">
                  <p className="text-gray-300 mb-6">Do you really want to delete this task?</p>
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={cancelDeleteTask}
                      className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors font-bebas"
                    >
                      No
                    </button>
                    <button
                      onClick={confirmDeleteTask}
                      className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors font-bebas"
                    >
                      Yes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Share Dialog */}
        <ShareDialog
          isOpen={showShareDialog}
          onClose={() => setShowShareDialog(false)}
        />
        
        {/* Keyboard Shortcuts Help */}
        <ShortcutHelp
          isOpen={showShortcutHelp}
          onClose={() => setShowShortcutHelp(false)}
          shortcuts={keyboardShortcuts}
        />
      </div>
    </DndContext>
  );
}

export default App;