'use client';

import { createContext, useContext, useState, useCallback } from 'react';

interface HabitsContextType {
  refreshHabits: () => Promise<void>;
}

const HabitsContext = createContext<HabitsContextType | undefined>(undefined);

export function HabitsProvider({ children }: { children: React.ReactNode }) {
  const refreshHabits = useCallback(async () => {
    // This will trigger a re-render in components that depend on this context
    const event = new CustomEvent('habits-changed');
    window.dispatchEvent(event);
  }, []);

  return (
    <HabitsContext.Provider value={{ refreshHabits }}>
      {children}
    </HabitsContext.Provider>
  );
}

export function useHabits() {
  const context = useContext(HabitsContext);
  if (context === undefined) {
    throw new Error('useHabits must be used within a HabitsProvider');
  }
  return context;
} 