'use client';

import { createContext, useContext, useState, useCallback } from 'react';

interface HabitsContextType {
  refreshHabits: () => Promise<void>;
  isPerformanceSorted: boolean;
  setIsPerformanceSorted: (value: boolean) => void;
}

const HabitsContext = createContext<HabitsContextType | undefined>(undefined);

export function HabitsProvider({ children }: { children: React.ReactNode }) {
  const [isPerformanceSorted, setIsPerformanceSorted] = useState(false);

  const refreshHabits = useCallback(async () => {
    const event = new CustomEvent('habits-changed');
    window.dispatchEvent(event);
  }, []);

  return (
    <HabitsContext.Provider value={{ 
      refreshHabits, 
      isPerformanceSorted, 
      setIsPerformanceSorted 
    }}>
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