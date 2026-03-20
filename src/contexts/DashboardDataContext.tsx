import { createContext, useContext, type ReactNode } from 'react';
import { useDashboardData } from '../hooks/useDashboardData';

type DashboardDataContextValue = ReturnType<typeof useDashboardData>;

const DashboardDataContext = createContext<DashboardDataContextValue | null>(null);

export function DashboardDataProvider({ children }: { children: ReactNode }) {
  const value = useDashboardData();
  return <DashboardDataContext.Provider value={value}>{children}</DashboardDataContext.Provider>;
}

export function useDashboardDataContext(): DashboardDataContextValue {
  const ctx = useContext(DashboardDataContext);
  if (!ctx) {
    throw new Error('useDashboardDataContext must be used within DashboardDataProvider');
  }
  return ctx;
}
