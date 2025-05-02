// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';

export interface User {
  id: string;
  username: string;
  email: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing auth on load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('http://127.0.0.1:8000/api/auth/user/', {
          headers: {
            'Authorization': `Token ${token}`,
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          // Token may be expired
          localStorage.removeItem('authToken');
        }
      } catch (err) {
        setError('Failed to authenticate');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('authToken', data.token);
        setUser(data.user);
        return true;
      } else {
        setError(data.error || 'Login failed');
        return false;
      }
    } catch (err) {
      setError('Network error during login');
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (registerData: RegisterData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      });

      const data = await response.json();
      
      if (response.ok) {
        // Some backends automatically log in after registration
        if (data.token) {
          localStorage.setItem('authToken', data.token);
          setUser(data.user);
        }
        return true;
      } else {
        setError(data.error || 'Registration failed');
        return false;
      }
    } catch (err) {
      setError('Network error during registration');
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    const token = localStorage.getItem('authToken');
    
    if (token) {
      try {
        await fetch('http://127.0.0.1:8000/api/auth/logout/', {
          method: 'POST',
          headers: {
            'Authorization': `Token ${token}`,
          }
        });
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
    
    localStorage.removeItem('authToken');
    setUser(null);
  };

  return { user, loading, error, login, register, logout };
};

// src/hooks/useSavingsGroups.ts
import { useState, useEffect, useCallback } from 'react';

export interface SavingsGroup {
  id: string;
  name: string;
  description: string;
  target_amount: number;
  current_amount: number;
  created_at: string;
  members: string[];
}

export const useSavingsGroups = () => {
  const [groups, setGroups] = useState<SavingsGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalSaved, setTotalSaved] = useState(0);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const token = localStorage.getItem('authToken');
    if (!token) {
      setLoading(false);
      setError('Authentication required');
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/api/groups/', {
        headers: {
          'Authorization': `Token ${token}`,
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setGroups(data);
        
        // Calculate total saved across all groups
        const total = data.reduce((sum: number, group: SavingsGroup) => sum + group.current_amount, 0);
        setTotalSaved(total);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch groups');
      }
    } catch (err) {
      setError('Network error while fetching groups');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch groups on mount
  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const createGroup = async (groupData: Omit<SavingsGroup, 'id' | 'current_amount' | 'created_at' | 'members'>) => {
    setLoading(true);
    setError(null);
    
    const token = localStorage.getItem('authToken');
    if (!token) {
      setLoading(false);
      setError('Authentication required');
      return false;
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/api/groups/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify(groupData),
      });
      
      if (response.ok) {
        // Refresh groups after creating
        await fetchGroups();
        return true;
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create group');
        return false;
      }
    } catch (err) {
      setError('Network error while creating group');
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { groups, totalSaved, loading, error, fetchGroups, createGroup };
};

// src/hooks/useTransactions.ts
import { useState, useCallback } from 'react';

export interface Transaction {
  id: string;
  group: string;
  amount: number;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  created_at: string;
  description?: string;
}

export interface TransactionRequest {
  group_id: string;
  amount: number;
  description?: string;
}

export const useTransactions = (groupId?: string) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async (specificGroupId?: string) => {
    setLoading(true);
    setError(null);
    
    const token = localStorage.getItem('authToken');
    if (!token) {
      setLoading(false);
      setError('Authentication required');
      return;
    }

    const targetGroupId = specificGroupId || groupId;
    const url = targetGroupId 
      ? `http://127.0.0.1:8000/api/groups/${targetGroupId}/transactions/`
      : 'http://127.0.0.1:8000/api/transactions/';

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Token ${token}`,
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch transactions');
      }
    } catch (err) {
      setError('Network error while fetching transactions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  const deposit = async (transactionData: TransactionRequest) => {
    return performTransaction(transactionData, 'deposit');
  };

  const withdraw = async (transactionData: TransactionRequest) => {
    return performTransaction(transactionData, 'withdraw');
  };

  const performTransaction = async (transactionData: TransactionRequest, type: 'deposit' | 'withdraw') => {
    setLoading(true);
    setError(null);
    
    const token = localStorage.getItem('authToken');
    if (!token) {
      setLoading(false);
      setError('Authentication required');
      return false;
    }

    try {
      const url = `http://127.0.0.1:8000/api/groups/${transactionData.group_id}/${type}/`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify({
          amount: transactionData.amount,
          description: transactionData.description || '',
        }),
      });
      
      if (response.ok) {
        // Refresh transactions after successful transaction
        await fetchTransactions(transactionData.group_id);
        return true;
      } else {
        const errorData = await response.json();
        setError(errorData.error || `Failed to ${type}`);
        return false;
      }
    } catch (err) {
      setError(`Network error during ${type}`);
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { 
    transactions, 
    loading, 
    error, 
    fetchTransactions, 
    deposit, 
    withdraw 
  };
};

// src/hooks/useActivities.ts
import { useState, useEffect } from 'react';

export interface Activity {
  id: string;
  user: string;
  activity_type: 'DEPOSIT' | 'WITHDRAWAL' | 'GROUP_CREATED' | 'GROUP_JOINED';
  target: string;
  amount?: number;
  created_at: string;
}

export const useActivities = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [recentCount, setRecentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = async () => {
    setLoading(true);
    setError(null);
    
    const token = localStorage.getItem('authToken');
    if (!token) {
      setLoading(false);
      setError('Authentication required');
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/api/activities/', {
        headers: {
          'Authorization': `Token ${token}`,
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setActivities(data);
        
        // Count recent activities (last 24 hours)
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        
        const recent = data.filter((activity: Activity) => 
          new Date(activity.created_at) > oneDayAgo
        );
        
        setRecentCount(recent.length);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch activities');
      }
    } catch (err) {
      setError('Network error while fetching activities');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch activities on mount
  useEffect(() => {
    fetchActivities();
  }, []);

  return { activities, recentCount, loading, error, fetchActivities };
};