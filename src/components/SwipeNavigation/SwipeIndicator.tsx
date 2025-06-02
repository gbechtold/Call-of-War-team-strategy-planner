import React from 'react';
import { FaChevronLeft, FaChevronRight, FaChevronUp, FaChevronDown } from 'react-icons/fa';

interface SwipeIndicatorProps {
  direction: 'left' | 'right' | 'up' | 'down';
  label: string;
  isVisible: boolean;
  className?: string;
}

export const SwipeIndicator: React.FC<SwipeIndicatorProps> = ({
  direction,
  label,
  isVisible,
  className = ''
}) => {
  const getIcon = () => {
    switch (direction) {
      case 'left': return <FaChevronLeft />;
      case 'right': return <FaChevronRight />;
      case 'up': return <FaChevronUp />;
      case 'down': return <FaChevronDown />;
    }
  };

  const getPositionClasses = () => {
    switch (direction) {
      case 'left': return 'left-4 top-1/2 transform -translate-y-1/2';
      case 'right': return 'right-4 top-1/2 transform -translate-y-1/2';
      case 'up': return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'down': return 'bottom-4 left-1/2 transform -translate-x-1/2';
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`
      fixed z-30 pointer-events-none
      ${getPositionClasses()}
      ${className}
    `}>
      <div className="bg-cod-primary/90 border-2 border-cod-accent/50 rounded-lg px-3 py-2 backdrop-blur-sm animate-pulse">
        <div className="flex items-center gap-2 text-cod-accent font-bebas text-sm">
          {getIcon()}
          <span>{label}</span>
        </div>
      </div>
    </div>
  );
};