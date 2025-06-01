import React, { useState, useEffect } from 'react';
import { Task, TaskType, TaskStatus } from '../../types';
import { format } from 'date-fns';

interface TaskFormProps {
  task?: Task;
  strategyId: string;
  onSubmit: (task: Omit<Task, 'id'>) => void;
  onCancel: () => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({ task, strategyId, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: task?.name || '',
    description: task?.description || '',
    type: task?.type || TaskType.UNIT_PRODUCTION,
    status: task?.status || TaskStatus.PENDING,
    category: task?.category || '',
    startDate: task ? format(new Date(task.startDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    endDate: task ? format(new Date(task.endDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    priority: task?.priority || 1,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
      strategyId,
      assignedPlayers: task?.assignedPlayers || [],
      dependencies: task?.dependencies || [],
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
        <label className="block text-sm font-medium text-gray-700">Task Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cod-accent focus:ring-cod-accent sm:text-sm"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cod-accent focus:ring-cod-accent sm:text-sm"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Task Type</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as TaskType })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cod-accent focus:ring-cod-accent sm:text-sm"
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
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cod-accent focus:ring-cod-accent sm:text-sm"
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
          <label className="block text-sm font-medium text-gray-700">Start Date</label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cod-accent focus:ring-cod-accent sm:text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">End Date</label>
          <input
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            min={formData.startDate}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cod-accent focus:ring-cod-accent sm:text-sm"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Priority</label>
        <select
          value={formData.priority}
          onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cod-accent focus:ring-cod-accent sm:text-sm"
        >
          <option value={1}>High</option>
          <option value={2}>Medium</option>
          <option value={3}>Low</option>
        </select>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cod-accent"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cod-accent hover:bg-cod-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cod-accent"
        >
          {task ? 'Update Task' : 'Create Task'}
        </button>
      </div>
    </form>
  );
};