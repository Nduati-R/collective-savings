
import React from "react";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { PiggyBank, TrendingUp, Users, Plus, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useGroups, Group } from "@/context/GroupContext";
import MainLayout from "@/components/layout/MainLayout";

const Dashboard = () => {
  const { isAuthenticated, user } = useAuth();
  const { groups } = useGroups();
  const navigate = useNavigate();
  
  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // Calculate summary statistics
  const totalSaved = groups.reduce((sum, group) => {
    // Only count contributions from the current user
    const userContributions = group.transactions
      .filter(t => t.userId === user?.id && t.type === "contribution" && t.status === "approved")
      .reduce((sum, t) => sum + t.amount, 0);
      
    return sum + userContributions;
  }, 0);
  
  const totalGroups = groups.length;
  
  // Get user's groups sorted by recent activity
  const myGroups = [...groups]
    .filter(group => group.members.some(m => m.id === user?.id))
    .sort((a, b) => {
      const aLatest = getLatestActivity(a);
      const bLatest = getLatestActivity(b);
      return bLatest - aLatest;
    })
    .slice(0, 3);
  
  // Get latest activity timestamp from a group
  function getLatestActivity(group: Group): number {
    if (group.transactions.length === 0) return new Date(group.createdAt).getTime();
    
    return new Date(
      group.transactions.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )[0].timestamp
    ).getTime();
  }
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };
  
  // Calculate progress percentage
  const getProgressPercentage = (current: number, target: number) => {
    return Math.min(Math.round((current / target) * 100), 100);
  };

  return (
    <MainLayout>
      {/* Welcome Section */}
      <section className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome, {user?.username}!</h1>
            <p className="text-muted-foreground">
              Here's an overview of your savings groups and progress.
            </p>
          </div>
          <Button onClick={() => navigate("/groups/new")} className="md:w-auto w-full">
            <Plus className="mr-2 h-4 w-4" /> Create New Group
          </Button>
        </div>
      </section>
      
      {/* Stats Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Saved</CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center">
              <PiggyBank className="mr-2 h-5 w-5 text-brand-teal" />
              {formatCurrency(totalSaved)}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Groups</CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center">
              <Users className="mr-2 h-5 w-5 text-brand-coral" />
              {totalGroups}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Recent Activity</CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-brand-success" />
              {groups.reduce((count, group) => {
                const recentTransactions = group.transactions
                  .filter(t => {
                    const date = new Date(t.timestamp);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return date >= weekAgo;
                  });
                return count + recentTransactions.length;
              }, 0)}
            </CardTitle>
          </CardHeader>
        </Card>
      </section>
      
      {/* Your Groups */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Your Groups</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate("/groups")}>
            View all <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
        
        {myGroups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {myGroups.map(group => (
              <Card key={group.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle>{group.name}</CardTitle>
                  <CardDescription className="line-clamp-1">{group.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="pb-2">
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span className="font-medium">
                        {formatCurrency(group.currentAmount)} / {formatCurrency(group.targetAmount)}
                      </span>
                    </div>
                    <Progress value={getProgressPercentage(group.currentAmount, group.targetAmount)} />
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">{group.members.length}</span> members
                  </p>
                </CardContent>
                
                <Separator />
                
                <CardFooter className="pt-2">
                  <Button variant="ghost" className="w-full" onClick={() => navigate(`/groups/${group.id}`)}>
                    View Group
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No Groups Yet</CardTitle>
              <CardDescription>
                You haven't joined any savings groups yet. Create one to get started.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => navigate("/groups/new")}>
                <Plus className="mr-2 h-4 w-4" /> Create New Group
              </Button>
            </CardFooter>
          </Card>
        )}
      </section>
      
      {/* Getting Started Tips */}
      {groups.length === 0 && (
        <section>
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>
                Welcome to GroupSave! Here are some tips to help you get started:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="bg-brand-teal rounded-full p-2 text-white">1</div>
                <div>
                  <h3 className="font-medium">Create a savings group</h3>
                  <p className="text-sm text-muted-foreground">
                    Start by creating a new savings group, setting a target amount and inviting members.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-brand-teal rounded-full p-2 text-white">2</div>
                <div>
                  <h3 className="font-medium">Make contributions</h3>
                  <p className="text-sm text-muted-foreground">
                    Add funds regularly to your group to reach your savings goals faster.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-brand-teal rounded-full p-2 text-white">3</div>
                <div>
                  <h3 className="font-medium">Track progress</h3>
                  <p className="text-sm text-muted-foreground">
                    Monitor your group's savings progress and transaction history.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => navigate("/groups/new")}>
                <Plus className="mr-2 h-4 w-4" /> Create Your First Group
              </Button>
            </CardFooter>
          </Card>
        </section>
      )}
    </MainLayout>
  );
};

export default Dashboard;
