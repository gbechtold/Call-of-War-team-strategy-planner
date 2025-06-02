import React from 'react';
import { useStrategyStore } from '../../store/useStrategyStore';
import { useCurrentStrategy } from '../../hooks/useCurrentStrategy';
import { FaRocket, FaShieldAlt, FaAnchor, FaIndustry } from 'react-icons/fa';
import { TaskType, TaskStatus } from '../../types';
import { addDays } from 'date-fns';

interface StrategyTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  tasks: Array<{
    name: string;
    type: TaskType;
    startDay: number;
    duration: number;
    category: string;
  }>;
}

const strategyTemplates: StrategyTemplate[] = [
  {
    id: 'blitzkrieg',
    name: 'Blitzkrieg',
    description: 'Fast armor & air assault',
    icon: <FaRocket />,
    tasks: [
      { name: 'Build Light Tanks', type: TaskType.UNIT_PRODUCTION, startDay: 0, duration: 1, category: 'Armor Production' },
      { name: 'Build Medium Tanks', type: TaskType.UNIT_PRODUCTION, startDay: 1, duration: 1, category: 'Armor Production' },
      { name: 'Build Interceptors', type: TaskType.UNIT_PRODUCTION, startDay: 0, duration: 1, category: 'Air Force Production' },
      { name: 'Build Tactical Bombers', type: TaskType.UNIT_PRODUCTION, startDay: 1, duration: 1, category: 'Air Force Production' },
      { name: 'Research Armor Doctrine', type: TaskType.RESEARCH, startDay: 0, duration: 3, category: 'Research' },
      { name: 'Build Motorized Infantry', type: TaskType.UNIT_PRODUCTION, startDay: 2, duration: 1, category: 'Infantry Production' },
      { name: 'Plan Attack Route', type: TaskType.CUSTOM, startDay: 3, duration: 1, category: 'Planning' },
    ]
  },
  {
    id: 'fortress',
    name: 'Fortress Europe',
    description: 'Defensive strategy',
    icon: <FaShieldAlt />,
    tasks: [
      { name: 'Build Infantry', type: TaskType.UNIT_PRODUCTION, startDay: 0, duration: 1, category: 'Infantry Production' },
      { name: 'Build Anti-Tank', type: TaskType.UNIT_PRODUCTION, startDay: 0, duration: 1, category: 'Artillery Production' },
      { name: 'Build Artillery', type: TaskType.UNIT_PRODUCTION, startDay: 1, duration: 1, category: 'Artillery Production' },
      { name: 'Research Fortifications', type: TaskType.RESEARCH, startDay: 0, duration: 2, category: 'Research' },
      { name: 'Build AA Guns', type: TaskType.UNIT_PRODUCTION, startDay: 2, duration: 1, category: 'Artillery Production' },
      { name: 'Fortify Borders', type: TaskType.CONSTRUCTION, startDay: 3, duration: 2, category: 'Construction' },
      { name: 'Train Reserves', type: TaskType.UNIT_PRODUCTION, startDay: 4, duration: 1, category: 'Infantry Production' },
    ]
  },
  {
    id: 'naval',
    name: 'Naval Dominance',
    description: 'Control the seas',
    icon: <FaAnchor />,
    tasks: [
      { name: 'Build Submarines', type: TaskType.UNIT_PRODUCTION, startDay: 0, duration: 1, category: 'Navy Production' },
      { name: 'Build Destroyers', type: TaskType.UNIT_PRODUCTION, startDay: 1, duration: 1, category: 'Navy Production' },
      { name: 'Build Naval Bombers', type: TaskType.UNIT_PRODUCTION, startDay: 0, duration: 1, category: 'Air Force Production' },
      { name: 'Research Naval Tech', type: TaskType.RESEARCH, startDay: 0, duration: 3, category: 'Research' },
      { name: 'Build Cruiser', type: TaskType.UNIT_PRODUCTION, startDay: 3, duration: 1, category: 'Navy Production' },
      { name: 'Establish Naval Base', type: TaskType.CONSTRUCTION, startDay: 2, duration: 2, category: 'Construction' },
    ]
  },
  {
    id: 'economic',
    name: 'Economic Victory',
    description: 'Resource optimization',
    icon: <FaIndustry />,
    tasks: [
      { name: 'Build Infrastructure', type: TaskType.CONSTRUCTION, startDay: 0, duration: 2, category: 'Construction' },
      { name: 'Research Industry', type: TaskType.RESEARCH, startDay: 0, duration: 3, category: 'Research' },
      { name: 'Build Militia', type: TaskType.UNIT_PRODUCTION, startDay: 0, duration: 1, category: 'Infantry Production' },
      { name: 'Upgrade Factories', type: TaskType.CONSTRUCTION, startDay: 3, duration: 2, category: 'Construction' },
      { name: 'Trade Agreements', type: TaskType.DIPLOMACY, startDay: 2, duration: 1, category: 'Diplomacy' },
      { name: 'Build Resource Centers', type: TaskType.CONSTRUCTION, startDay: 5, duration: 2, category: 'Construction' },
    ]
  }
];

export const AutoPlan: React.FC = () => {
  const { createTask } = useStrategyStore();
  const { strategy } = useCurrentStrategy();

  const applyTemplate = (template: StrategyTemplate) => {
    if (!strategy) return;

    if (!confirm(`Apply "${template.name}" strategy template? This will add ${template.tasks.length} new tasks.`)) {
      return;
    }

    const startDate = new Date();
    
    template.tasks.forEach(taskTemplate => {
      const taskStartDate = addDays(startDate, taskTemplate.startDay);
      const taskEndDate = addDays(taskStartDate, taskTemplate.duration - 1);
      
      createTask({
        name: taskTemplate.name,
        description: `Part of ${template.name} strategy`,
        type: taskTemplate.type,
        status: TaskStatus.PENDING,
        category: taskTemplate.category,
        startDate: taskStartDate,
        endDate: taskEndDate,
        strategyId: strategy.id,
        assignedPlayers: [],
        dependencies: [],
        priority: 2,
      });
    });
  };

  return (
    <div className="bg-cod-secondary/90 backdrop-blur-sm p-3 rounded-lg shadow-2xl border-2 border-cod-accent/20 w-56">
      <h2 className="text-lg font-bebas text-cod-accent mb-3">
        <FaRocket className="inline mr-2" />
        Auto-Plan Strategies
      </h2>
      
      <div className="space-y-2">
        {strategyTemplates.map(template => (
          <button
            key={template.id}
            onClick={() => applyTemplate(template)}
            className="w-full p-3 bg-cod-primary/50 hover:bg-cod-primary/70 rounded border border-cod-accent/30 hover:border-cod-accent/50 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="text-2xl text-cod-accent group-hover:scale-110 transition-transform">
                {template.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-bebas text-cod-accent text-sm">{template.name}</h3>
                <p className="text-xs text-gray-400">{template.description}</p>
                <p className="text-xs text-gray-500 mt-1">{template.tasks.length} tasks</p>
              </div>
            </div>
          </button>
        ))}
      </div>
      
      <p className="text-xs text-gray-500 mt-3 text-center">
        Click to apply template
      </p>
    </div>
  );
};