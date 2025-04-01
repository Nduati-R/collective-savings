
import React from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LogOut, User, Users, PiggyBank, Home, Menu } from "lucide-react";

const MainLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Get user initials for avatar
  const getInitials = () => {
    if (!user) return "?";
    return user.username.substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <PiggyBank className="h-6 w-6 text-brand-teal" />
            <span className="text-xl font-bold">GroupSave</span>
          </Link>

          {user ? (
            <div className="flex items-center space-x-4 md:space-x-6">
              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-6">
                <Link to="/" className="text-sm font-medium hover:text-brand-teal transition-colors">
                  Dashboard
                </Link>
                <Link to="/groups" className="text-sm font-medium hover:text-brand-teal transition-colors">
                  My Groups
                </Link>
              </nav>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full" size="icon">
                    <Avatar>
                      <AvatarFallback className="bg-brand-teal text-white">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="flex items-center justify-start p-2">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user.username}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <User className="mr-2 h-4 w-4" /> Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Menu */}
              <div className="md:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate("/")}>
                      <Home className="mr-2 h-4 w-4" /> Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/groups")}>
                      <Users className="mr-2 h-4 w-4" /> My Groups
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="outline">Login</Button>
              </Link>
              <Link to="/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        {children || <Outlet />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} GroupSave. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
