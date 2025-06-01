import React from 'react';
import { type Task } from '../../types';

interface TaskDependenciesProps {
  tasks: Task[];
  visibleTasks: Task[];
  calculateTaskPosition: (task: Task) => { left: number; width: number } | null;
}

export const TaskDependencies: React.FC<TaskDependenciesProps> = ({
  tasks,
  visibleTasks,
  calculateTaskPosition
}) => {
  const renderDependencyLines = () => {
    const lines: JSX.Element[] = [];
    
    visibleTasks.forEach((task) => {
      if (task.dependencies && task.dependencies.length > 0) {
        task.dependencies.forEach((depId) => {
          const dependentTask = tasks.find(t => t.id === depId);
          if (!dependentTask) return;
          
          const taskPos = calculateTaskPosition(task);
          const depPos = calculateTaskPosition(dependentTask);
          
          if (!taskPos || !depPos) return;
          
          // Calculate line coordinates
          const startX = depPos.left + depPos.width;
          const endX = taskPos.left;
          const startY = 50; // Approximate middle of task row
          const endY = 50;
          
          // Only draw line if there's space between tasks
          if (endX > startX) {
            lines.push(
              <svg
                key={`${depId}-${task.id}`}
                className="absolute inset-0 pointer-events-none"
                style={{ zIndex: 10 }}
              >
                <defs>
                  <marker
                    id={`arrowhead-${depId}-${task.id}`}
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon
                      points="0 0, 10 3.5, 0 7"
                      fill="#D4AF37"
                      opacity="0.7"
                    />
                  </marker>
                </defs>
                <path
                  d={`M ${startX}% ${startY}% L ${endX}% ${endY}%`}
                  stroke="#D4AF37"
                  strokeWidth="2"
                  strokeOpacity="0.7"
                  fill="none"
                  markerEnd={`url(#arrowhead-${depId}-${task.id})`}
                />
              </svg>
            );
          }
        });
      }
    });
    
    return lines;
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {renderDependencyLines()}
    </div>
  );
};