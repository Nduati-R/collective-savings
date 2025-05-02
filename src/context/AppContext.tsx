// src/context/AppContext.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth, User } from '../hooks/useAuth';
import { useSavingsGroups, SavingsGroup } from '../hooks/useSavingsGroups';
import { useActivities, Activity } from '../hooks/useActivities';

interface AppContextType {
  // Auth
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (credentials: { username: string; password: string }) => Promise<boolean>;
  register: (data: { username: string; email: string; password: string; confirmPassword: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  
  // Groups
  groups: SavingsGroup[];
  totalSaved: number;
  fetchGroups: () => Promise<void>;
  createGroup: (groupData: { name: string; description: string; target_amount: number }) => Promise<boolean>;
  
  // Activities
  activities: Activity[];
  recentCount: number;
  fetchActivities: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const auth = useAuth();
  const savingsGroups = useSavingsGroups();
  const activitiesData = useActivities();

  // Combine all the data and functions from our hooks
  const value = {
    // Auth
    user: auth.user,
    loading: auth.loading || savingsGroups.loading || activitiesData.loading,
    error: auth.error || savingsGroups.error || activitiesData.error,
    login: auth.login,
    register: auth.register,
    logout: auth.logout,
    
    // Groups
    groups: savingsGroups.groups,
    totalSaved: savingsGroups.totalSaved,
    fetchGroups: savingsGroups.fetchGroups,
    createGroup: savingsGroups.createGroup,
    
    // Activities
    activities: activitiesData.activities,
    recentCount: activitiesData.recentCount,
    fetchActivities: activitiesData.fetchActivities,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};