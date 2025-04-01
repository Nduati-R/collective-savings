
import React, { createContext, useState, useContext, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";

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
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load groups from localStorage on mount
  useEffect(() => {
    const loadGroups = async () => {
      setIsLoading(true);
      try {
        const storedGroups = localStorage.getItem("groups");
        
        if (storedGroups) {
          setGroups(JSON.parse(storedGroups));
        } else {
          // Initialize with empty array if no groups found
          localStorage.setItem("groups", JSON.stringify([]));
        }
      } catch (error) {
        console.error("Error loading groups:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadGroups();
    } else {
      setGroups([]);
      setIsLoading(false);
    }
  }, [user]);

  // Save groups to localStorage whenever they change
  useEffect(() => {
    if (user && groups.length > 0) {
      localStorage.setItem("groups", JSON.stringify(groups));
    }
  }, [groups, user]);

  const createGroup = async (newGroup: Omit<Group, "id" | "currentAmount" | "transactions" | "createdAt">) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const createdGroup: Group = {
        ...newGroup,
        id: Math.random().toString(36).substr(2, 9),
        currentAmount: 0,
        transactions: [],
        createdAt: new Date().toISOString(),
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
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setGroups(prev => prev.map(group => {
        if (group.id === groupId) {
          // Check if user is already a member
          const isMember = group.members.some(member => member.id === user.id);
          if (isMember) {
            throw new Error("You are already a member of this group");
          }
          
          return {
            ...group,
            members: [...group.members, { id: user.id, username: user.username }]
          };
        }
        return group;
      }));
      
      toast.success("You have joined the group successfully!");
    } catch (error) {
      console.error("Error joining group:", error);
      toast.error(error instanceof Error ? error.message : "Failed to join group");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const leaveGroup = async (groupId: string) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Find the group
      const group = groups.find(g => g.id === groupId);
      
      if (!group) {
        throw new Error("Group not found");
      }
      
      // Check if user is the admin
      if (group.admin === user.id) {
        throw new Error("Admin cannot leave the group. Transfer ownership first.");
      }
      
      setGroups(prev => prev.map(group => {
        if (group.id === groupId) {
          return {
            ...group,
            members: group.members.filter(member => member.id !== user.id)
          };
        }
        return group;
      }));
      
      toast.success("You have left the group successfully.");
    } catch (error) {
      console.error("Error leaving group:", error);
      toast.error(error instanceof Error ? error.message : "Failed to leave group");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getGroupById = (groupId: string) => {
    return groups.find(group => group.id === groupId);
  };

  const contributeToGroup = async (groupId: string, amount: number) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const contribution: Transaction = {
        id: Math.random().toString(36).substr(2, 9),
        groupId,
        userId: user.id,
        username: user.username,
        amount,
        type: "contribution",
        status: "approved", // Contributions are automatically approved
        timestamp: new Date().toISOString()
      };
      
      setGroups(prev => prev.map(group => {
        if (group.id === groupId) {
          return {
            ...group,
            currentAmount: group.currentAmount + amount,
            transactions: [...group.transactions, contribution]
          };
        }
        return group;
      }));
      
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
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const group = groups.find(g => g.id === groupId);
      
      if (!group) {
        throw new Error("Group not found");
      }
      
      if (amount > group.currentAmount) {
        throw new Error("Withdrawal amount exceeds available funds");
      }
      
      const withdrawal: Transaction = {
        id: Math.random().toString(36).substr(2, 9),
        groupId,
        userId: user.id,
        username: user.username,
        amount,
        type: "withdrawal",
        status: "pending",
        timestamp: new Date().toISOString()
      };
      
      setGroups(prev => prev.map(group => {
        if (group.id === groupId) {
          return {
            ...group,
            transactions: [...group.transactions, withdrawal]
          };
        }
        return group;
      }));
      
      toast.success("Withdrawal request submitted for approval");
    } catch (error) {
      console.error("Error requesting withdrawal:", error);
      toast.error(error instanceof Error ? error.message : "Failed to request withdrawal");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const approveWithdrawal = async (groupId: string, transactionId: string) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const group = groups.find(g => g.id === groupId);
      
      if (!group) {
        throw new Error("Group not found");
      }
      
      // Check if user is the admin
      if (group.admin !== user.id) {
        throw new Error("Only the admin can approve withdrawals");
      }
      
      const transaction = group.transactions.find(t => t.id === transactionId);
      
      if (!transaction) {
        throw new Error("Transaction not found");
      }
      
      if (transaction.type !== "withdrawal" || transaction.status !== "pending") {
        throw new Error("This transaction cannot be approved");
      }
      
      if (transaction.amount > group.currentAmount) {
        throw new Error("Insufficient funds in the group");
      }
      
      setGroups(prev => prev.map(group => {
        if (group.id === groupId) {
          return {
            ...group,
            currentAmount: group.currentAmount - transaction.amount,
            transactions: group.transactions.map(t => 
              t.id === transactionId 
                ? { ...t, status: "approved" } 
                : t
            )
          };
        }
        return group;
      }));
      
      toast.success("Withdrawal request approved");
    } catch (error) {
      console.error("Error approving withdrawal:", error);
      toast.error(error instanceof Error ? error.message : "Failed to approve withdrawal");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const rejectWithdrawal = async (groupId: string, transactionId: string) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const group = groups.find(g => g.id === groupId);
      
      if (!group) {
        throw new Error("Group not found");
      }
      
      // Check if user is the admin
      if (group.admin !== user.id) {
        throw new Error("Only the admin can reject withdrawals");
      }
      
      const transaction = group.transactions.find(t => t.id === transactionId);
      
      if (!transaction) {
        throw new Error("Transaction not found");
      }
      
      if (transaction.type !== "withdrawal" || transaction.status !== "pending") {
        throw new Error("This transaction cannot be rejected");
      }
      
      setGroups(prev => prev.map(group => {
        if (group.id === groupId) {
          return {
            ...group,
            transactions: group.transactions.map(t => 
              t.id === transactionId 
                ? { ...t, status: "rejected" } 
                : t
            )
          };
        }
        return group;
      }));
      
      toast.success("Withdrawal request rejected");
    } catch (error) {
      console.error("Error rejecting withdrawal:", error);
      toast.error(error instanceof Error ? error.message : "Failed to reject withdrawal");
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
