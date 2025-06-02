import React from 'react';
import { formatShortcut, type KeyboardShortcut } from '../../hooks/useKeyboardShortcuts';

interface ShortcutTooltipProps {
  shortcut?: KeyboardShortcut;
  children: React.ReactNode;
  className?: string;
}

export const ShortcutTooltip: React.FC<ShortcutTooltipProps> = ({ 
  shortcut, 
  children, 
  className = '' 
}) => {
  if (!shortcut) {
    return <>{children}</>;
  }

  // Check if we're in the header area by looking for a parent with header classes
  const [isInHeader, setIsInHeader] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (ref.current) {
      const header = ref.current.closest('header');
      setIsInHeader(!!header);
    }
  }, []);

  const tooltipPosition = isInHeader 
    ? "top-full mt-2" // Position below for header items
    : "bottom-full mb-2"; // Position above for other items

  const arrowClasses = isInHeader
    ? "absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-b-2 border-transparent border-b-cod-accent/30"
    : "absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-cod-accent/30";

  return (
    <div ref={ref} className={`group relative ${className}`}>
      {children}
      <div className={`absolute ${tooltipPosition} left-1/2 transform -translate-x-1/2 px-2 py-1 bg-cod-primary border border-cod-accent/30 rounded text-xs text-cod-accent font-bebas whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50`}>
        <div className="flex items-center gap-1">
          <span>{shortcut.description}</span>
          <span className="px-1 py-0.5 bg-cod-accent/20 rounded text-[10px] font-mono">
            {formatShortcut(shortcut)}
          </span>
        </div>
        {/* Arrow */}
        <div className={arrowClasses}></div>
      </div>
    </div>
  );
};