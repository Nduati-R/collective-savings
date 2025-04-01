
import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useGroups } from "@/context/GroupContext";
import MainLayout from "@/components/layout/MainLayout";

const GroupsList = () => {
  const { isAuthenticated, user } = useAuth();
  const { groups } = useGroups();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // Filter groups based on search term
  const filteredGroups = groups.filter(group => 
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    group.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Split groups into My Groups and Other Groups
  const myGroups = filteredGroups.filter(group => 
    group.members.some(member => member.id === user?.id)
  );
  
  const otherGroups = filteredGroups.filter(group => 
    !group.members.some(member => member.id === user?.id)
  );
  
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Savings Groups</h1>
          <p className="text-muted-foreground">
            View and manage your savings groups
          </p>
        </div>
        <Button onClick={() => navigate("/groups/new")}>
          <Plus className="mr-2 h-4 w-4" /> Create New Group
        </Button>
      </div>
      
      {/* Search and Filters */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search groups..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {/* Groups Tabs */}
      <Tabs defaultValue="my-groups" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="my-groups">My Groups</TabsTrigger>
          <TabsTrigger value="discover">Discover Groups</TabsTrigger>
        </TabsList>
        
        <TabsContent value="my-groups">
          {myGroups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {myGroups.map(group => (
                <Card key={group.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle>{group.name}</CardTitle>
                    <CardDescription className="line-clamp-2">{group.description}</CardDescription>
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
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Groups Found</CardTitle>
                <CardDescription>
                  {searchTerm 
                    ? "No groups match your search criteria."
                    : "You haven't joined any savings groups yet."}
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button onClick={() => navigate("/groups/new")}>
                  <Plus className="mr-2 h-4 w-4" /> Create New Group
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="discover">
          {otherGroups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {otherGroups.map(group => (
                <Card key={group.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle>{group.name}</CardTitle>
                    <CardDescription className="line-clamp-2">{group.description}</CardDescription>
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
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigate(`/groups/${group.id}`)}
                    >
                      View Group
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Groups Found</CardTitle>
                <CardDescription>
                  {searchTerm 
                    ? "No groups match your search criteria."
                    : "There are no other groups available to join at the moment."}
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button onClick={() => navigate("/groups/new")}>
                  <Plus className="mr-2 h-4 w-4" /> Create New Group
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
};

export default GroupsList;
