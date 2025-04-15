
import React, { createContext, useState, useContext, useEffect } from "react";
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
        const token = localStorage.getItem("token");
        
        if (token) {
          // Verify token by fetching user profile
          const response = await api.get("/users/profile/");
          setUser(response.data);
        }
      } catch (error) {
        console.error("Authentication error:", error);
        // Clear invalid token
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Get JWT token
      const tokenResponse = await api.post("/token/", {
        email,
        password,
      });
      
      const { access, refresh } = tokenResponse.data;
      
      // Save tokens
      localStorage.setItem("token", access);
      localStorage.setItem("refreshToken", refresh);
      
      // Get user profile
      const userResponse = await api.get("/users/profile/");
      setUser(userResponse.data);
      
      toast.success("Successfully logged in!");
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Failed to login. Please check your credentials and try again.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (username: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      // Register user
      await api.post("/users/register/", {
        username,
        email,
        password,
        password2: password,
      });
      
      // Login after successful registration
      await login(email, password);
      
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
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    setUser(null);
    toast.info("You have been logged out.");
  };

  const updateProfile = async (updatedUser: Partial<User>) => {
    setIsLoading(true);
    try {
      // Update user profile
      const response = await api.patch("/users/profile/update/", updatedUser);
      
      // Update user state with the returned data
      const updatedUserData = { ...user, ...response.data };
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
