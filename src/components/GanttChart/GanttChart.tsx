import React from 'react';
import { Task } from '../../types';
import { format, startOfWeek, addDays, differenceInDays, isWithinInterval } from 'date-fns';
import { TaskBar } from './TaskBar';

interface GanttChartProps {
  tasks: Task[];
  startDate: Date;
  endDate: Date;
  onTaskClick?: (task: Task) => void;
}

export const GanttChart: React.FC<GanttChartProps> = ({ 
  tasks, 
  startDate, 
  endDate,
  onTaskClick 
}) => {
  const totalDays = differenceInDays(endDate, startDate) + 1;
  const weeks = Math.ceil(totalDays / 7);
  
  const renderTimelineHeader = () => {
    const headers = [];
    const weekStart = startOfWeek(startDate, { weekStartsOn: 1 });
    
    for (let week = 0; week < weeks; week++) {
      const weekDates = [];
      for (let day = 0; day < 7; day++) {
        const currentDate = addDays(weekStart, week * 7 + day);
        if (isWithinInterval(currentDate, { start: startDate, end: endDate })) {
          weekDates.push(
            <div key={`${week}-${day}`} className="flex-1 text-center text-xs border-r border-gray-300 p-1">
              <div className="font-semibold">{format(currentDate, 'EEE')}</div>
              <div className="text-gray-600">{format(currentDate, 'd')}</div>
            </div>
          );
        }
      }
      
      if (weekDates.length > 0) {
        headers.push(
          <div key={week} className="flex flex-col">
            <div className="text-center font-bold p-2 border-b border-gray-300">
              Week {week + 1} - {format(addDays(weekStart, week * 7), 'MMM yyyy')}
            </div>
            <div className="flex">
              {weekDates}
            </div>
          </div>
        );
      }
    }
    
    return headers;
  };
  
  const calculateTaskPosition = (task: Task) => {
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);
    
    const startOffset = Math.max(0, differenceInDays(taskStart, startDate));
    const endOffset = Math.min(totalDays, differenceInDays(taskEnd, startDate) + 1);
    const duration = endOffset - startOffset;
    
    return {
      left: (startOffset / totalDays) * 100,
      width: (duration / totalDays) * 100
    };
  };
  
  const groupedTasks = tasks.reduce((acc, task) => {
    const category = task.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(task);
    return acc;
  }, {} as Record<string, Task[]>);
  
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="flex">
        <div className="w-48 bg-gray-100">
          <div className="h-24 border-b border-gray-300 p-2 font-bold">
            Task Categories
          </div>
          {Object.keys(groupedTasks).map(category => (
            <div key={category} className="border-b border-gray-300">
              <div className="p-2 font-semibold bg-gray-200">{category}</div>
              {groupedTasks[category].map(task => (
                <div key={task.id} className="h-12 border-b border-gray-200 px-2 py-1 text-sm truncate">
                  {task.name}
                </div>
              ))}
            </div>
          ))}
        </div>
        
        <div className="flex-1 overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="h-24 border-b border-gray-300 flex">
              {renderTimelineHeader()}
            </div>
            
            {Object.keys(groupedTasks).map(category => (
              <div key={category} className="border-b border-gray-300">
                <div className="h-8 bg-gray-200"></div>
                {groupedTasks[category].map(task => {
                  const position = calculateTaskPosition(task);
                  return (
                    <div key={task.id} className="h-12 border-b border-gray-200 relative">
                      <TaskBar
                        task={task}
                        left={position.left}
                        width={position.width}
                        onClick={() => onTaskClick?.(task)}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};