import { useEffect, useState } from 'react';
import { DndContext } from '@dnd-kit/core';
import { GanttChart } from './components/GanttChart';
import { TaskForm } from './components/TaskForm/TaskForm';
import { Modal } from './components/Modal/Modal';
import { UnitMenu } from './components/UnitMenu/UnitMenu';
import { useStrategyStore } from './store/useStrategyStore';
import { useCurrentStrategy } from './hooks/useCurrentStrategy';
import { type Task, type Unit, TaskType, TaskStatus } from './types';
import { addDays } from 'date-fns';
import { FaPlus, FaBars } from 'react-icons/fa';
import { getUnitBuildDuration } from './data/units';
import './App.css';

function App() {
  const { createStrategy, createTask, updateTask } = useStrategyStore();
  const { strategy, tasks } = useCurrentStrategy();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [showUnitMenu, setShowUnitMenu] = useState(true);
  
  // Initialize with demo data
  useEffect(() => {
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
  }, [strategy, createStrategy]);
  
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
  
  const handleTaskMove = (taskId: string, newStartDate: Date, newEndDate: Date) => {
    updateTask(taskId, { startDate: newStartDate, endDate: newEndDate });
  };
  
  const handleUnitDrop = (unit: Unit, dropDate: Date) => {
    const buildDuration = getUnitBuildDuration(unit);
    createTask({
      name: `Build ${unit.name}`,
      description: `Production time: ${unit.buildTime} hours`,
      type: TaskType.UNIT_PRODUCTION,
      status: TaskStatus.PENDING,
      category: 'Unit Production',
      startDate: dropDate,
      endDate: addDays(dropDate, buildDuration),
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
      <div className="min-h-screen bg-cod-secondary">
        <header className="bg-cod-primary text-white p-4 shadow-2xl border-b-4 border-cod-accent">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bebas text-cod-accent tracking-wider">Call of War Strategy Planner</h1>
              <p className="text-gray-300">{strategy.name}</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowUnitMenu(!showUnitMenu)}
                className="flex items-center gap-2 px-4 py-2 bg-cod-secondary border-2 border-cod-accent text-cod-accent rounded-md hover:bg-cod-accent hover:text-cod-primary transition-all font-bebas"
              >
                <FaBars /> Units Menu
              </button>
              <button
                onClick={handleNewTask}
                className="flex items-center gap-2 px-4 py-2 bg-cod-accent text-cod-primary rounded-md hover:bg-cod-accent/90 transition-all font-bebas text-lg"
              >
                <FaPlus /> Add Task
              </button>
            </div>
          </div>
        </header>
        
        <main className="container mx-auto p-4 flex gap-6">
          {showUnitMenu && (
            <div className="animate-fadeIn">
              <UnitMenu />
            </div>
          )}
          
          <div className="flex-1">
            <div className="mb-6">
              <h2 className="text-3xl font-bebas text-cod-accent mb-2">Strategy Timeline</h2>
              <p className="text-gray-400">{strategy.description}</p>
            </div>
            
            <GanttChart
              tasks={tasks}
              startDate={strategy.startDate}
              endDate={strategy.endDate}
              onTaskClick={handleTaskClick}
              onTaskMove={handleTaskMove}
              onUnitDrop={handleUnitDrop}
            />
          </div>
        </main>
        
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
          />
        </Modal>
      </div>
    </DndContext>
  );
}

export default App;