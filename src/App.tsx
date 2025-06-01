import { useEffect, useState } from 'react';
import { GanttChart } from './components/GanttChart';
import { TaskForm } from './components/TaskForm/TaskForm';
import { Modal } from './components/Modal/Modal';
import { useStrategyStore } from './store/useStrategyStore';
import { useCurrentStrategy } from './hooks/useCurrentStrategy';
import { type Task, TaskType, TaskStatus } from './types';
import { addDays } from 'date-fns';
import { FaPlus } from 'react-icons/fa';
import './App.css';

function App() {
  const { createStrategy, createTask, updateTask } = useStrategyStore();
  const { strategy, tasks } = useCurrentStrategy();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  
  // Initialize with demo data
  useEffect(() => {
    if (!strategy) {
      // Create a demo strategy
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
        },
        {
          name: 'Move to Eastern Border',
          description: 'Position troops for offensive',
          type: TaskType.MOVEMENT,
          status: TaskStatus.PENDING,
          category: 'Movement',
          startDate: addDays(new Date(), 4),
          endDate: addDays(new Date(), 6),
          strategyId: strategy.id,
          assignedPlayers: [],
          dependencies: [],
          priority: 2
        },
        {
          name: 'Attack Enemy Base',
          description: 'Launch coordinated assault',
          type: TaskType.ATTACK,
          status: TaskStatus.PENDING,
          category: 'Combat',
          startDate: addDays(new Date(), 7),
          endDate: addDays(new Date(), 9),
          strategyId: strategy.id,
          assignedPlayers: [],
          dependencies: [],
          priority: 1
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
  
  if (!strategy) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-cod-primary text-white p-4 shadow-lg">
        <h1 className="text-3xl font-bold font-bebas">Call of War Strategy Planner</h1>
        <p className="text-cod-accent">{strategy.name}</p>
      </header>
      
      <main className="container mx-auto p-4">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold mb-2">Strategy Timeline</h2>
            <p className="text-gray-600">{strategy.description}</p>
          </div>
          <button
            onClick={handleNewTask}
            className="flex items-center gap-2 px-4 py-2 bg-cod-accent text-white rounded-md hover:bg-cod-accent/90 transition-colors"
          >
            <FaPlus /> Add Task
          </button>
        </div>
        
        <GanttChart
          tasks={tasks}
          startDate={strategy.startDate}
          endDate={strategy.endDate}
          onTaskClick={handleTaskClick}
          onTaskMove={handleTaskMove}
        />
        
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
      </main>
    </div>
  );
}

export default App;