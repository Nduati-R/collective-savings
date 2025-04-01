
import React, { createContext, useState, useContext, useEffect } from "react";
import { toast } from "sonner";

type User = {
  id: string;
  username: string;
  email: string;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (user: Partial<User>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        const token = localStorage.getItem("token");
        
        if (storedUser && token) {
          // In a real app, verify the token with the backend here
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Authentication error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // For the purpose of this demo, we'll simulate authentication calls
  // In a real app, these would be API calls to your Django backend
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, we're not validating credentials
      const mockUser = {
        id: "1",
        username: email.split('@')[0],
        email,
      };
      
      // Save to localStorage (in a real app, you'd get a token from your API)
      localStorage.setItem("user", JSON.stringify(mockUser));
      localStorage.setItem("token", "mock-jwt-token");
      
      setUser(mockUser);
      toast.success("Successfully logged in!");
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Failed to login. Please try again.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (username: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockUser = {
        id: Math.random().toString(36).substr(2, 9), // Generate random ID
        username,
        email,
      };
      
      localStorage.setItem("user", JSON.stringify(mockUser));
      localStorage.setItem("token", "mock-jwt-token");
      
      setUser(mockUser);
      toast.success("Account created successfully!");
    } catch (error) {
      console.error("Signup error:", error);
      toast.error("Failed to create account. Please try again.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    toast.info("You have been logged out.");
  };

  const updateProfile = async (updatedUser: Partial<User>) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedUserData = { ...user, ...updatedUser };
      localStorage.setItem("user", JSON.stringify(updatedUserData));
      
      setUser(updatedUserData as User);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Failed to update profile. Please try again.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
