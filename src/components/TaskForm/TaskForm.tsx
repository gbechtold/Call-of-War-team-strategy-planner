import React, { useState, useEffect } from 'react';
import { type Task, TaskType, TaskStatus } from '../../types';
import { useStrategyStore } from '../../store/useStrategyStore';
import { format } from 'date-fns';

interface TaskFormProps {
  task?: Task;
  strategyId: string;
  onSubmit: (task: Omit<Task, 'id'>) => void;
  onCancel: () => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({ task, strategyId, onSubmit, onCancel }) => {
  const { players, tasks } = useStrategyStore();
  const availableTasks = tasks.filter(t => t.strategyId === strategyId && t.id !== task?.id);
  
  const [formData, setFormData] = useState({
    name: task?.name || '',
    description: task?.description || '',
    type: task?.type || TaskType.UNIT_PRODUCTION,
    status: task?.status || TaskStatus.PENDING,
    category: task?.category || '',
    startDate: task ? format(new Date(task.startDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    endDate: task ? format(new Date(task.endDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    priority: task?.priority || 1,
    assignedPlayers: task?.assignedPlayers || [],
    dependencies: task?.dependencies || [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
      strategyId,
      assignedPlayers: formData.assignedPlayers,
      dependencies: formData.dependencies,
    });
  };

  const getCategoryForType = (type: TaskType): string => {
    const categoryMap: Record<TaskType, string> = {
      [TaskType.UNIT_PRODUCTION]: 'Unit Production',
      [TaskType.RESEARCH]: 'Research',
      [TaskType.MOVEMENT]: 'Movement',
      [TaskType.ATTACK]: 'Combat',
      [TaskType.DEFENSE]: 'Combat',
      [TaskType.CONSTRUCTION]: 'Construction',
      [TaskType.DIPLOMACY]: 'Diplomacy',
      [TaskType.CUSTOM]: 'Other',
    };
    return categoryMap[type];
  };

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      category: getCategoryForType(prev.type as TaskType)
    }));
  }, [formData.type]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-bebas text-cod-accent mb-1">Task Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 block w-full"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-bebas text-cod-accent mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="mt-1 block w-full"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bebas text-cod-accent mb-1">Task Type</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as TaskType })}
            className="mt-1 block w-full"
          >
            <option value={TaskType.UNIT_PRODUCTION}>Unit Production</option>
            <option value={TaskType.RESEARCH}>Research</option>
            <option value={TaskType.MOVEMENT}>Movement</option>
            <option value={TaskType.ATTACK}>Attack</option>
            <option value={TaskType.DEFENSE}>Defense</option>
            <option value={TaskType.CONSTRUCTION}>Construction</option>
            <option value={TaskType.DIPLOMACY}>Diplomacy</option>
            <option value={TaskType.CUSTOM}>Custom</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-bebas text-cod-accent mb-1">Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
            className="mt-1 block w-full"
          >
            <option value={TaskStatus.PENDING}>Pending</option>
            <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
            <option value={TaskStatus.COMPLETED}>Completed</option>
            <option value={TaskStatus.CANCELLED}>Cancelled</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bebas text-cod-accent mb-1">Start Date</label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            className="mt-1 block w-full"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bebas text-cod-accent mb-1">End Date</label>
          <input
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            min={formData.startDate}
            className="mt-1 block w-full"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-bebas text-cod-accent mb-1">Priority</label>
        <select
          value={formData.priority}
          onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
          className="mt-1 block w-full"
        >
          <option value={1}>High</option>
          <option value={2}>Medium</option>
          <option value={3}>Low</option>
        </select>
      </div>

      {players.length > 0 && (
        <div>
          <label className="block text-sm font-bebas text-cod-accent mb-2">Assign Players</label>
          <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
            {players.map((player) => (
              <label key={player.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.assignedPlayers.includes(player.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData({
                        ...formData,
                        assignedPlayers: [...formData.assignedPlayers, player.id]
                      });
                    } else {
                      setFormData({
                        ...formData,
                        assignedPlayers: formData.assignedPlayers.filter(id => id !== player.id)
                      });
                    }
                  }}
                  className="rounded border-cod-accent/30 text-cod-accent focus:ring-cod-accent"
                />
                <div
                  className="w-3 h-3 rounded-full border border-white/50"
                  style={{ backgroundColor: player.color }}
                />
                <span className="text-sm text-gray-300">{player.name} ({player.nation})</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {availableTasks.length > 0 && (
        <div>
          <label className="block text-sm font-bebas text-cod-accent mb-2">Task Dependencies</label>
          <p className="text-xs text-gray-400 mb-2">Select tasks that must complete before this task can start</p>
          <div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar">
            {availableTasks.map((availableTask) => (
              <label key={availableTask.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.dependencies.includes(availableTask.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData({
                        ...formData,
                        dependencies: [...formData.dependencies, availableTask.id]
                      });
                    } else {
                      setFormData({
                        ...formData,
                        dependencies: formData.dependencies.filter(id => id !== availableTask.id)
                      });
                    }
                  }}
                  className="rounded border-cod-accent/30 text-cod-accent focus:ring-cod-accent"
                />
                <span className="text-xs text-gray-300">{availableTask.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border-2 border-cod-accent/50 rounded-md text-sm font-bebas text-cod-accent bg-transparent hover:bg-cod-accent/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cod-accent transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 border-2 border-transparent rounded-md text-sm font-bebas text-cod-primary bg-cod-accent hover:bg-cod-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cod-accent transition-colors"
        >
          {task ? 'Update Task' : 'Create Task'}
        </button>
      </div>
    </form>
  );
};