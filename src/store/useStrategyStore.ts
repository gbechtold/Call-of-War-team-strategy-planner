import { create } from 'zustand';
import { type Task, type Player, type Strategy } from '../types';

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
  
  // Storage actions
  saveStrategyWithCode: (shareCode: string) => void;
  loadStrategyFromCode: (shareCode: string) => boolean;
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
  
  saveStrategyWithCode: (shareCode) => set((state) => {
    if (!state.currentStrategyId) return state;
    
    const strategy = state.strategies.find(s => s.id === state.currentStrategyId);
    if (!strategy) return state;
    
    // Save to localStorage with shareCode as key
    const savedStrategies = JSON.parse(localStorage.getItem('savedStrategies') || '{}');
    savedStrategies[shareCode] = {
      strategy,
      tasks: state.tasks.filter(t => t.strategyId === strategy.id),
      players: state.players.filter(p => strategy.players?.includes(p.id)),
      savedAt: new Date().toISOString(),
      shareCode
    };
    localStorage.setItem('savedStrategies', JSON.stringify(savedStrategies));
    
    return state;
  }),
  
  loadStrategyFromCode: (shareCode) => {
    const savedStrategies = JSON.parse(localStorage.getItem('savedStrategies') || '{}');
    const savedData = savedStrategies[shareCode];
    
    if (!savedData) return false;
    
    // Import the saved strategy
    const importedStrategy = {
      ...savedData.strategy,
      name: `${savedData.strategy.name} (Loaded)`,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      startDate: new Date(savedData.strategy.startDate),
      endDate: new Date(savedData.strategy.endDate)
    };
    
    set((state) => {
      const newState = {
        ...state,
        strategies: [...state.strategies, importedStrategy],
        currentStrategyId: importedStrategy.id
      };
      
      // Import tasks
      savedData.tasks.forEach((task: any) => {
        const newTask = {
          ...task,
          id: generateId(),
          strategyId: importedStrategy.id,
          startDate: new Date(task.startDate),
          endDate: new Date(task.endDate)
        };
        newState.tasks.push(newTask);
      });
      
      // Import players
      savedData.players.forEach((player: any) => {
        if (!newState.players.find(p => p.id === player.id)) {
          newState.players.push(player);
        }
      });
      
      return newState;
    });
    
    return true;
  }
}));