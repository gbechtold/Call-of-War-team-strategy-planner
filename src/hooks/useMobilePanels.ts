import { useState, useCallback } from 'react';

export interface Panel {
  id: string;
  name: string;
  component: React.ComponentType;
  icon?: string;
}

export const useMobilePanels = (panels: Panel[]) => {
  const [currentPanelIndex, setCurrentPanelIndex] = useState(-1); // -1 means no panel open
  const [isAnyPanelOpen, setIsAnyPanelOpen] = useState(false);

  const openPanel = useCallback((panelId: string) => {
    const index = panels.findIndex(panel => panel.id === panelId);
    if (index !== -1) {
      setCurrentPanelIndex(index);
      setIsAnyPanelOpen(true);
    }
  }, [panels]);

  const closeAllPanels = useCallback(() => {
    setCurrentPanelIndex(-1);
    setIsAnyPanelOpen(false);
  }, []);

  const swipeToNextPanel = useCallback(() => {
    if (!isAnyPanelOpen) return;
    
    const nextIndex = currentPanelIndex + 1;
    if (nextIndex < panels.length) {
      setCurrentPanelIndex(nextIndex);
    } else {
      // Loop back to first panel
      setCurrentPanelIndex(0);
    }
  }, [currentPanelIndex, panels.length, isAnyPanelOpen]);

  const swipeToPrevPanel = useCallback(() => {
    if (!isAnyPanelOpen) return;
    
    const prevIndex = currentPanelIndex - 1;
    if (prevIndex >= 0) {
      setCurrentPanelIndex(prevIndex);
    } else {
      // Loop to last panel
      setCurrentPanelIndex(panels.length - 1);
    }
  }, [currentPanelIndex, panels.length, isAnyPanelOpen]);

  const handlePanelSwipe = useCallback((direction: 'left' | 'right') => {
    if (direction === 'left') {
      swipeToNextPanel();
    } else {
      swipeToPrevPanel();
    }
  }, [swipeToNextPanel, swipeToPrevPanel]);

  const getCurrentPanel = useCallback(() => {
    if (currentPanelIndex >= 0 && currentPanelIndex < panels.length) {
      return panels[currentPanelIndex];
    }
    return null;
  }, [currentPanelIndex, panels]);

  const isPanelOpen = useCallback((panelId: string) => {
    const currentPanel = getCurrentPanel();
    return currentPanel?.id === panelId;
  }, [getCurrentPanel]);

  return {
    currentPanelIndex,
    isAnyPanelOpen,
    openPanel,
    closeAllPanels,
    handlePanelSwipe,
    getCurrentPanel,
    isPanelOpen,
    swipeToNextPanel,
    swipeToPrevPanel
  };
};