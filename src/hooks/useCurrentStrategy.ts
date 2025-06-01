import { useStrategyStore } from '../store/useStrategyStore';

export const useCurrentStrategy = () => {
  const { strategies, currentStrategyId, tasks } = useStrategyStore();
  
  const currentStrategy = strategies.find(s => s.id === currentStrategyId);
  const currentTasks = tasks.filter(t => t.strategyId === currentStrategyId);
  
  return {
    strategy: currentStrategy,
    tasks: currentTasks,
  };
};