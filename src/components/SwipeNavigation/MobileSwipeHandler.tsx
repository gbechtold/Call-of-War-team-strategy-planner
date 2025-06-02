import React, { useEffect, useRef, useState } from 'react';
import { useSwipeGestures, useIsMobile } from '../../hooks/useSwipeGestures';
import { SwipeIndicator } from './SwipeIndicator';

interface MobileSwipeHandlerProps {
  children: React.ReactNode;
  onPanelSwipe?: (direction: 'left' | 'right') => void;
  onTimelineSwipe?: (direction: 'up' | 'down') => void;
  onTimelineZoom?: (scale: number) => void;
  enableHints?: boolean;
  className?: string;
}

export const MobileSwipeHandler: React.FC<MobileSwipeHandlerProps> = ({
  children,
  onPanelSwipe,
  onTimelineSwipe,
  onTimelineZoom,
  enableHints = true,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [showHints, setShowHints] = useState(false);
  const [hintTimeout, setHintTimeout] = useState<NodeJS.Timeout | null>(null);

  const { attachListeners } = useSwipeGestures(
    {
      onSwipeLeft: () => {
        if (onPanelSwipe) {
          onPanelSwipe('left');
          showTemporaryHint();
        }
      },
      onSwipeRight: () => {
        if (onPanelSwipe) {
          onPanelSwipe('right');
          showTemporaryHint();
        }
      },
      onSwipeUp: () => {
        if (onTimelineSwipe) {
          onTimelineSwipe('up');
          showTemporaryHint();
        }
      },
      onSwipeDown: () => {
        if (onTimelineSwipe) {
          onTimelineSwipe('down');
          showTemporaryHint();
        }
      },
      onPinch: (scale: number) => {
        if (onTimelineZoom) {
          onTimelineZoom(scale);
        }
      }
    },
    {
      minSwipeDistance: 60,
      maxSwipeTime: 400,
      preventScrollOnTouch: false,
      enablePinch: true
    }
  );

  const showTemporaryHint = () => {
    if (!enableHints || !isMobile) return;
    
    setShowHints(true);
    
    if (hintTimeout) {
      clearTimeout(hintTimeout);
    }
    
    const timeout = setTimeout(() => {
      setShowHints(false);
    }, 2000);
    
    setHintTimeout(timeout);
  };

  // Show hints on first mobile load
  useEffect(() => {
    if (isMobile && enableHints) {
      const hasSeenHints = localStorage.getItem('swipe-hints-seen');
      if (!hasSeenHints) {
        setTimeout(() => {
          setShowHints(true);
          const timeout = setTimeout(() => {
            setShowHints(false);
            localStorage.setItem('swipe-hints-seen', 'true');
          }, 4000);
          setHintTimeout(timeout);
        }, 1000);
      }
    }
  }, [isMobile, enableHints]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isMobile) return;

    const cleanup = attachListeners(container);
    return cleanup;
  }, [attachListeners, isMobile]);

  useEffect(() => {
    return () => {
      if (hintTimeout) {
        clearTimeout(hintTimeout);
      }
    };
  }, [hintTimeout]);

  return (
    <div 
      ref={containerRef} 
      className={`relative ${className}`}
      style={{ touchAction: 'pan-x pan-y' }}
    >
      {children}
      
      {/* Swipe Hints - only show on mobile */}
      {isMobile && enableHints && (
        <>
          <SwipeIndicator
            direction="left"
            label="Swipe for panels"
            isVisible={showHints}
          />
          <SwipeIndicator
            direction="right"
            label="Swipe for panels"
            isVisible={showHints}
          />
          <SwipeIndicator
            direction="up"
            label="Navigate timeline"
            isVisible={showHints}
          />
          <SwipeIndicator
            direction="down"
            label="Navigate timeline"
            isVisible={showHints}
          />
        </>
      )}
    </div>
  );
};