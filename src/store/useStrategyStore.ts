import { create } from 'zustand';
import { Task, Player, Strategy } from '../types';

interface StrategyStore {
  strategies: Strategy[];
  currentStrategyId: string | null;
  tasks: Task[];
  players: Player[];
  
  // Strategy actions
  createStrategy: (strategy: Omit<Strategy, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateStrategy: (id: string, updates: Partial<Strategy>) => void;
  deleteStrategy: (id: string) => void;
  setCurrentStrategy: (id: string) => void;
  
  // Task actions
  createTask: (task: Omit<Task, 'id'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  
  // Player actions
  addPlayer: (player: Omit<Player, 'id'>) => void;
  updatePlayer: (id: string, updates: Partial<Player>) => void;
  removePlayer: (id: string) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useStrategyStore = create<StrategyStore>((set) => ({
  strategies: [],
  currentStrategyId: null,
  tasks: [],
  players: [],
  
  createStrategy: (strategy) => set((state) => {
    const newStrategy: Strategy = {
      ...strategy,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return { 
      strategies: [...state.strategies, newStrategy],
      currentStrategyId: newStrategy.id 
    };
  }),
  
  updateStrategy: (id, updates) => set((state) => ({
    strategies: state.strategies.map(s => 
      s.id === id ? { ...s, ...updates, updatedAt: new Date() } : s
    ),
  })),
  
  deleteStrategy: (id) => set((state) => ({
    strategies: state.strategies.filter(s => s.id !== id),
    currentStrategyId: state.currentStrategyId === id ? null : state.currentStrategyId,
    tasks: state.tasks.filter(t => t.strategyId !== id),
  })),
  
  setCurrentStrategy: (id) => set({ currentStrategyId: id }),
  
  createTask: (task) => set((state) => {
    const newTask: Task = {
      ...task,
      id: generateId(),
    };
    return { tasks: [...state.tasks, newTask] };
  }),
  
  updateTask: (id, updates) => set((state) => ({
    tasks: state.tasks.map(t => 
      t.id === id ? { ...t, ...updates } : t
    ),
  })),
  
  deleteTask: (id) => set((state) => ({
    tasks: state.tasks.filter(t => t.id !== id),
  })),
  
  addPlayer: (player) => set((state) => {
    const newPlayer: Player = {
      ...player,
      id: generateId(),
    };
    return { players: [...state.players, newPlayer] };
  }),
  
  updatePlayer: (id, updates) => set((state) => ({
    players: state.players.map(p => 
      p.id === id ? { ...p, ...updates } : p
    ),
  })),
  
  removePlayer: (id) => set((state) => ({
    players: state.players.filter(p => p.id !== id),
    tasks: state.tasks.map(t => ({
      ...t,
      assignedPlayers: t.assignedPlayers.filter(pid => pid !== id),
    })),
  })),
}));