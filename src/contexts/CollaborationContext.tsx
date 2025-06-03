import React, { createContext, useContext, type ReactNode } from 'react';
import { useCollaboration as useCollaborationHook } from '../hooks/useCollaboration';

// Create the collaboration context
const CollaborationContext = createContext<ReturnType<typeof useCollaborationHook> | null>(null);

// Provider component
export const CollaborationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const collaboration = useCollaborationHook();
  
  return (
    <CollaborationContext.Provider value={collaboration}>
      {children}
    </CollaborationContext.Provider>
  );
};

// Custom hook to use the collaboration context
export const useCollaboration = () => {
  const context = useContext(CollaborationContext);
  
  if (!context) {
    throw new Error('useCollaboration must be used within a CollaborationProvider');
  }
  
  return context;
};