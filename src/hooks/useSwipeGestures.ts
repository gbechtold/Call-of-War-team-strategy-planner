import { useEffect, useRef, useState } from 'react';

export interface SwipeDirection {
  horizontal: 'left' | 'right' | null;
  vertical: 'up' | 'down' | null;
}

export interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinch?: (scale: number) => void;
  onTap?: () => void;
}

export interface SwipeGestureConfig {
  minSwipeDistance?: number;
  maxSwipeTime?: number;
  preventScrollOnTouch?: boolean;
  enablePinch?: boolean;
}

export const useSwipeGestures = (
  handlers: SwipeHandlers,
  config: SwipeGestureConfig = {}
) => {
  const {
    minSwipeDistance = 50,
    maxSwipeTime = 300,
    preventScrollOnTouch = true,
    enablePinch = false
  } = config;

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchEndRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const initialPinchDistanceRef = useRef<number | null>(null);
  const [isPinching, setIsPinching] = useState(false);

  const getDistance = (touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      // Single touch - start tracking swipe
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      };
      touchEndRef.current = null;
      setIsPinching(false);
    } else if (e.touches.length === 2 && enablePinch) {
      // Two touches - start tracking pinch
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      initialPinchDistanceRef.current = getDistance(touch1, touch2);
      setIsPinching(true);
      touchStartRef.current = null;
    }

    if (preventScrollOnTouch) {
      e.preventDefault();
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (isPinching && e.touches.length === 2 && enablePinch && handlers.onPinch) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = getDistance(touch1, touch2);
      
      if (initialPinchDistanceRef.current) {
        const scale = currentDistance / initialPinchDistanceRef.current;
        handlers.onPinch(scale);
      }
    } else if (e.touches.length === 1 && touchStartRef.current) {
      const touch = e.touches[0];
      touchEndRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      };
    }

    if (preventScrollOnTouch) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    if (isPinching) {
      setIsPinching(false);
      initialPinchDistanceRef.current = null;
      return;
    }

    if (!touchStartRef.current || !touchEndRef.current) {
      // Check for tap
      if (touchStartRef.current && handlers.onTap) {
        const timeDiff = Date.now() - touchStartRef.current.time;
        if (timeDiff < 200) { // Quick tap
          handlers.onTap();
        }
      }
      return;
    }

    const timeDiff = touchEndRef.current.time - touchStartRef.current.time;
    
    if (timeDiff > maxSwipeTime) {
      return; // Too slow to be a swipe
    }

    const deltaX = touchEndRef.current.x - touchStartRef.current.x;
    const deltaY = touchEndRef.current.y - touchStartRef.current.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Determine if it's a significant swipe
    if (absDeltaX < minSwipeDistance && absDeltaY < minSwipeDistance) {
      return; // Distance too small
    }

    // Determine primary direction
    if (absDeltaX > absDeltaY) {
      // Horizontal swipe
      if (deltaX > 0 && handlers.onSwipeRight) {
        handlers.onSwipeRight();
      } else if (deltaX < 0 && handlers.onSwipeLeft) {
        handlers.onSwipeLeft();
      }
    } else {
      // Vertical swipe
      if (deltaY > 0 && handlers.onSwipeDown) {
        handlers.onSwipeDown();
      } else if (deltaY < 0 && handlers.onSwipeUp) {
        handlers.onSwipeUp();
      }
    }

    // Reset
    touchStartRef.current = null;
    touchEndRef.current = null;
  };

  const attachListeners = (element: HTMLElement) => {
    element.addEventListener('touchstart', handleTouchStart, { passive: !preventScrollOnTouch });
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventScrollOnTouch });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  };

  return { attachListeners, isPinching };
};

// Hook for detecting mobile device
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor;
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      const isMobileDevice = mobileRegex.test(userAgent) || window.innerWidth <= 768;
      setIsMobile(isMobileDevice);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};