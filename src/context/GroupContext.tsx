
import React, { createContext, useState, useContext, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";
import axios from "axios";

// API base URL - update to match your Django backend
const API_URL = "http://localhost:8000/api";

// Create axios instance with baseURL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add interceptor to include token in requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export type Member = {
  id: string;
  username: string;
};

export type Transaction = {
  id: string;
  groupId: string;
  userId: string;
  username: string;
  amount: number;
  type: "contribution" | "withdrawal";
  status: "pending" | "approved" | "rejected";
  timestamp: string;
};

export type Group = {
  id: string;
  name: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  admin: string;
  members: Member[];
  transactions: Transaction[];
  createdAt: string;
};

type GroupContextType = {
  groups: Group[];
  isLoading: boolean;
  createGroup: (group: Omit<Group, "id" | "currentAmount" | "transactions" | "createdAt">) => Promise<void>;
  joinGroup: (groupId: string) => Promise<void>;
  leaveGroup: (groupId: string) => Promise<void>;
  getGroupById: (groupId: string) => Group | undefined;
  contributeToGroup: (groupId: string, amount: number) => Promise<void>;
  requestWithdrawal: (groupId: string, amount: number) => Promise<void>;
  approveWithdrawal: (groupId: string, transactionId: string) => Promise<void>;
  rejectWithdrawal: (groupId: string, transactionId: string) => Promise<void>;
};

const GroupContext = createContext<GroupContextType | undefined>(undefined);

export const GroupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load groups from API on mount or when auth state changes
  useEffect(() => {
    const fetchGroups = async () => {
      if (!isAuthenticated) {
        setGroups([]);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        const response = await api.get("/groups/");
        
        // Transform data to match our frontend model
        const transformedGroups = response.data.map((group: any) => ({
          id: group.id,
          name: group.name,
          description: group.description,
          targetAmount: group.target_amount,
          currentAmount: group.current_amount,
          admin: group.admin.id,
          members: group.members.map((member: any) => ({
            id: member.id,
            username: member.username,
          })),
          transactions: group.transactions.map((tx: any) => ({
            id: tx.id,
            groupId: tx.group,
            userId: tx.user.id,
            username: tx.username,
            amount: tx.amount,
            type: tx.type,
            status: tx.status,
            timestamp: tx.timestamp,
          })),
          createdAt: group.created_at,
        }));
        
        setGroups(transformedGroups);
      } catch (error) {
        console.error("Error fetching groups:", error);
        toast.error("Failed to load groups. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroups();
  }, [isAuthenticated]);

  const createGroup = async (newGroup: Omit<Group, "id" | "currentAmount" | "transactions" | "createdAt">) => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    try {
      const response = await api.post("/groups/", {
        name: newGroup.name,
        description: newGroup.description,
        target_amount: newGroup.targetAmount,
      });
      
      // Transform API response to match our frontend model
      const createdGroup: Group = {
        id: response.data.id,
        name: response.data.name,
        description: response.data.description,
        targetAmount: response.data.target_amount,
        currentAmount: response.data.current_amount,
        admin: response.data.admin.id,
        members: response.data.members.map((member: any) => ({
          id: member.id,
          username: member.username,
        })),
        transactions: [],
        createdAt: response.data.created_at,
      };
      
      setGroups(prev => [...prev, createdGroup]);
      toast.success("Group created successfully!");
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error("Failed to create group. Please try again.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const joinGroup = async (groupId: string) => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    try {
      await api.post(`/groups/${groupId}/join/`);
      
      // Fetch updated group
      const response = await api.get(`/groups/${groupId}/`);
      
      // Transform API response
      const updatedGroup: Group = {
        id: response.data.id,
        name: response.data.name,
        description: response.data.description,
        targetAmount: response.data.target_amount,
        currentAmount: response.data.current_amount,
        admin: response.data.admin.id,
        members: response.data.members.map((member: any) => ({
          id: member.id,
          username: member.username,
        })),
        transactions: response.data.transactions.map((tx: any) => ({
          id: tx.id,
          groupId: tx.group,
          userId: tx.user.id,
          username: tx.username,
          amount: tx.amount,
          type: tx.type,
          status: tx.status,
          timestamp: tx.timestamp,
        })),
        createdAt: response.data.created_at,
      };
      
      setGroups(prev => {
        const index = prev.findIndex(group => group.id === groupId);
        if (index >= 0) {
          const newGroups = [...prev];
          newGroups[index] = updatedGroup;
          return newGroups;
        }
        return [...prev, updatedGroup];
      });
      
      toast.success("You have joined the group successfully!");
    } catch (error) {
      console.error("Error joining group:", error);
      toast.error("Failed to join group. Please try again.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const leaveGroup = async (groupId: string) => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    try {
      await api.post(`/groups/${groupId}/leave/`);
      
      // Remove group from list if user is no longer a member
      setGroups(prev => prev.filter(group => group.id !== groupId));
      
      toast.success("You have left the group successfully.");
    } catch (error) {
      console.error("Error leaving group:", error);
      toast.error("Failed to leave group. Please try again.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getGroupById = (groupId: string) => {
    return groups.find(group => group.id === groupId);
  };

  const contributeToGroup = async (groupId: string, amount: number) => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    try {
      await api.post(`/transactions/contribute/${groupId}/`, {
        amount,
      });
      
      // Fetch updated group
      const response = await api.get(`/groups/${groupId}/`);
      
      // Transform API response
      const updatedGroup: Group = {
        id: response.data.id,
        name: response.data.name,
        description: response.data.description,
        targetAmount: response.data.target_amount,
        currentAmount: response.data.current_amount,
        admin: response.data.admin.id,
        members: response.data.members.map((member: any) => ({
          id: member.id,
          username: member.username,
        })),
        transactions: response.data.transactions.map((tx: any) => ({
          id: tx.id,
          groupId: tx.group,
          userId: tx.user.id,
          username: tx.username,
          amount: tx.amount,
          type: tx.type,
          status: tx.status,
          timestamp: tx.timestamp,
        })),
        createdAt: response.data.created_at,
      };
      
      setGroups(prev => prev.map(group => 
        group.id === groupId ? updatedGroup : group
      ));
      
      toast.success(`Successfully contributed ${amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`);
    } catch (error) {
      console.error("Error contributing to group:", error);
      toast.error("Failed to process contribution. Please try again.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const requestWithdrawal = async (groupId: string, amount: number) => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    try {
      await api.post(`/transactions/withdraw/${groupId}/`, {
        amount,
      });
      
      // Fetch updated group
      const response = await api.get(`/groups/${groupId}/`);
      
      // Transform API response
      const updatedGroup: Group = {
        id: response.data.id,
        name: response.data.name,
        description: response.data.description,
        targetAmount: response.data.target_amount,
        currentAmount: response.data.current_amount,
        admin: response.data.admin.id,
        members: response.data.members.map((member: any) => ({
          id: member.id,
          username: member.username,
        })),
        transactions: response.data.transactions.map((tx: any) => ({
          id: tx.id,
          groupId: tx.group,
          userId: tx.user.id,
          username: tx.username,
          amount: tx.amount,
          type: tx.type,
          status: tx.status,
          timestamp: tx.timestamp,
        })),
        createdAt: response.data.created_at,
      };
      
      setGroups(prev => prev.map(group => 
        group.id === groupId ? updatedGroup : group
      ));
      
      toast.success("Withdrawal request submitted for approval");
    } catch (error) {
      console.error("Error requesting withdrawal:", error);
      toast.error("Failed to request withdrawal. Please try again.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const approveWithdrawal = async (groupId: string, transactionId: string) => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    try {
      await api.post(`/transactions/approve/${groupId}/`, {
        transaction_id: transactionId,
      });
      
      // Fetch updated group
      const response = await api.get(`/groups/${groupId}/`);
      
      // Transform API response
      const updatedGroup: Group = {
        id: response.data.id,
        name: response.data.name,
        description: response.data.description,
        targetAmount: response.data.target_amount,
        currentAmount: response.data.current_amount,
        admin: response.data.admin.id,
        members: response.data.members.map((member: any) => ({
          id: member.id,
          username: member.username,
        })),
        transactions: response.data.transactions.map((tx: any) => ({
          id: tx.id,
          groupId: tx.group,
          userId: tx.user.id,
          username: tx.username,
          amount: tx.amount,
          type: tx.type,
          status: tx.status,
          timestamp: tx.timestamp,
        })),
        createdAt: response.data.created_at,
      };
      
      setGroups(prev => prev.map(group => 
        group.id === groupId ? updatedGroup : group
      ));
      
      toast.success("Withdrawal request approved");
    } catch (error) {
      console.error("Error approving withdrawal:", error);
      toast.error("Failed to approve withdrawal. Please try again.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const rejectWithdrawal = async (groupId: string, transactionId: string) => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    try {
      await api.post(`/transactions/reject/${groupId}/`, {
        transaction_id: transactionId,
      });
      
      // Fetch updated group
      const response = await api.get(`/groups/${groupId}/`);
      
      // Transform API response
      const updatedGroup: Group = {
        id: response.data.id,
        name: response.data.name,
        description: response.data.description,
        targetAmount: response.data.target_amount,
        currentAmount: response.data.current_amount,
        admin: response.data.admin.id,
        members: response.data.members.map((member: any) => ({
          id: member.id,
          username: member.username,
        })),
        transactions: response.data.transactions.map((tx: any) => ({
          id: tx.id,
          groupId: tx.group,
          userId: tx.user.id,
          username: tx.username,
          amount: tx.amount,
          type: tx.type,
          status: tx.status,
          timestamp: tx.timestamp,
        })),
        createdAt: response.data.created_at,
      };
      
      setGroups(prev => prev.map(group => 
        group.id === groupId ? updatedGroup : group
      ));
      
      toast.success("Withdrawal request rejected");
    } catch (error) {
      console.error("Error rejecting withdrawal:", error);
      toast.error("Failed to reject withdrawal. Please try again.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GroupContext.Provider
      value={{
        groups,
        isLoading,
        createGroup,
        joinGroup,
        leaveGroup,
        getGroupById,
        contributeToGroup,
        requestWithdrawal,
        approveWithdrawal,
        rejectWithdrawal,
      }}
    >
      {children}
    </GroupContext.Provider>
  );
};

export const useGroups = () => {
  const context = useContext(GroupContext);
  if (context === undefined) {
    throw new Error("useGroups must be used within a GroupProvider");
  }
  return context;
};
