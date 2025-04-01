
import React, { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  Loader2, 
  Users, 
  AlertCircle, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Check, 
  X, 
  Clock
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import { useGroups, Transaction } from "@/context/GroupContext";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import MainLayout from "@/components/layout/MainLayout";
import { toast } from "sonner";

// Form schema for contribution
const contributionSchema = z.object({
  amount: z
    .string()
    .min(1, { message: "Amount is required" })
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Amount must be a positive number",
    }),
});

// Form schema for withdrawal
const withdrawalSchema = z.object({
  amount: z
    .string()
    .min(1, { message: "Amount is required" })
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Amount must be a positive number",
    }),
});

type ContributionFormValues = z.infer<typeof contributionSchema>;
type WithdrawalFormValues = z.infer<typeof withdrawalSchema>;

const GroupDetail = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { isAuthenticated, user } = useAuth();
  const { getGroupById, contributeToGroup, requestWithdrawal, joinGroup, leaveGroup, approveWithdrawal, rejectWithdrawal, isLoading } = useGroups();
  const navigate = useNavigate();
  const [showContributeDialog, setShowContributeDialog] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  
  // Get group by ID
  const group = getGroupById(groupId || "");
  
  // Setup forms
  const contributeForm = useForm<ContributionFormValues>({
    resolver: zodResolver(contributionSchema),
    defaultValues: {
      amount: "",
    },
  });
  
  const withdrawForm = useForm<WithdrawalFormValues>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: "",
    },
  });
  
  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // Handle if group not found
  if (!group) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto text-center py-16">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="mt-4 text-3xl font-bold tracking-tight">Group Not Found</h1>
          <p className="mt-2 text-muted-foreground">
            The group you're looking for doesn't exist or has been deleted.
          </p>
          <Button className="mt-6" onClick={() => navigate("/groups")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Groups
          </Button>
        </div>
      </MainLayout>
    );
  }
  
  // Check if user is group member
  const isMember = group.members.some(member => member.id === user?.id);
  
  // Check if user is admin
  const isAdmin = group.admin === user?.id;
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  // Calculate progress percentage
  const getProgressPercentage = (current: number, target: number) => {
    return Math.min(Math.round((current / target) * 100), 100);
  };
  
  // Handle join group
  const handleJoinGroup = async () => {
    if (!group) return;
    try {
      await joinGroup(group.id);
    } catch (error) {
      console.error("Error joining group:", error);
    }
  };
  
  // Handle leave group
  const handleLeaveGroup = async () => {
    if (!group) return;
    try {
      await leaveGroup(group.id);
      navigate("/groups");
    } catch (error) {
      console.error("Error leaving group:", error);
    }
  };
  
  // Handle contribution
  const handleContribute = async (data: ContributionFormValues) => {
    if (!group) return;
    try {
      await contributeToGroup(group.id, Number(data.amount));
      contributeForm.reset();
      setShowContributeDialog(false);
    } catch (error) {
      console.error("Error contributing:", error);
    }
  };
  
  // Handle withdrawal request
  const handleWithdraw = async (data: WithdrawalFormValues) => {
    if (!group) return;
    try {
      await requestWithdrawal(group.id, Number(data.amount));
      withdrawForm.reset();
      setShowWithdrawDialog(false);
    } catch (error) {
      console.error("Error requesting withdrawal:", error);
    }
  };
  
  // Handle approve withdrawal
  const handleApproveWithdrawal = async (transactionId: string) => {
    if (!group) return;
    try {
      await approveWithdrawal(group.id, transactionId);
      toast.success("Withdrawal request approved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to approve withdrawal");
      console.error("Error approving withdrawal:", error);
    }
  };
  
  // Handle reject withdrawal
  const handleRejectWithdrawal = async (transactionId: string) => {
    if (!group) return;
    try {
      await rejectWithdrawal(group.id, transactionId);
      toast.success("Withdrawal request rejected");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reject withdrawal");
      console.error("Error rejecting withdrawal:", error);
    }
  };
  
  // Filter transactions based on status for pending withdrawals
  const pendingWithdrawals = group.transactions.filter(
    t => t.type === "withdrawal" && t.status === "pending"
  );
  
  // Get transaction icon based on type and status
  const getTransactionIcon = (transaction: Transaction) => {
    if (transaction.type === "contribution") {
      return <ArrowUpCircle className="h-5 w-5 text-brand-success" />;
    } else if (transaction.type === "withdrawal") {
      if (transaction.status === "pending") {
        return <Clock className="h-5 w-5 text-brand-warning" />;
      } else if (transaction.status === "approved") {
        return <ArrowDownCircle className="h-5 w-5 text-brand-coral" />;
      } else {
        return <X className="h-5 w-5 text-muted-foreground" />;
      }
    }
  };
  
  // Get transaction status badge
  const getStatusBadge = (status: string) => {
    if (status === "pending") {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>;
    } else if (status === "approved") {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Approved</span>;
    } else if (status === "rejected") {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Rejected</span>;
    }
    return null;
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/groups")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Groups
          </Button>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{group.name}</h1>
              <p className="text-muted-foreground">
                Created {formatDate(group.createdAt)}
              </p>
            </div>
            {isMember ? (
              <div className="flex gap-2 w-full md:w-auto">
                {isAdmin ? (
                  <Button variant="outline" className="w-full md:w-auto" disabled>
                    Admin
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    className="w-full md:w-auto"
                    onClick={handleLeaveGroup}
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Leave Group"}
                  </Button>
                )}
                <Dialog open={showContributeDialog} onOpenChange={setShowContributeDialog}>
                  <DialogTrigger asChild>
                    <Button className="w-full md:w-auto">Contribute</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Make a Contribution</DialogTitle>
                      <DialogDescription>
                        Enter the amount you want to contribute to this savings group.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...contributeForm}>
                      <form onSubmit={contributeForm.handleSubmit(handleContribute)} className="space-y-4">
                        <FormField
                          control={contributeForm.control}
                          name="amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Amount</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                  <Input className="pl-7" placeholder="100" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <DialogFooter>
                          <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                              </>
                            ) : (
                              "Confirm Contribution"
                            )}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
                <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full md:w-auto">Request Withdrawal</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Request a Withdrawal</DialogTitle>
                      <DialogDescription>
                        Enter the amount you want to withdraw from this savings group.
                        The admin will need to approve your request.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...withdrawForm}>
                      <form onSubmit={withdrawForm.handleSubmit(handleWithdraw)} className="space-y-4">
                        <FormField
                          control={withdrawForm.control}
                          name="amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Amount</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                  <Input className="pl-7" placeholder="50" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <DialogFooter>
                          <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                              </>
                            ) : (
                              "Submit Request"
                            )}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <Button 
                onClick={handleJoinGroup}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Join Group"}
              </Button>
            )}
          </div>
        </div>
        
        {/* Group Overview Card */}
        <Card className="mb-8">
          <CardHeader className="pb-2">
            <CardTitle>Group Overview</CardTitle>
            <CardDescription>
              {group.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Savings Progress</h3>
              <div className="flex justify-between text-sm mb-1">
                <span>Current Amount</span>
                <span className="font-medium">
                  {formatCurrency(group.currentAmount)} / {formatCurrency(group.targetAmount)}
                </span>
              </div>
              <Progress value={getProgressPercentage(group.currentAmount, group.targetAmount)} className="h-2" />
              <p className="text-xs text-right mt-1 text-muted-foreground">
                {getProgressPercentage(group.currentAmount, group.targetAmount)}% of target
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">Members</h3>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{group.members.length} members</span>
              </div>
              <div className="mt-2 space-y-1">
                {group.members.map(member => (
                  <div key={member.id} className="flex items-center justify-between text-sm">
                    <span>{member.username}</span>
                    {group.admin === member.id && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Admin</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Admin Panel - Only shown to admin and if there are pending withdrawals */}
        {isAdmin && pendingWithdrawals.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-brand-warning" />
                Pending Approval
              </CardTitle>
              <CardDescription>
                These withdrawal requests require your approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingWithdrawals.map(transaction => (
                  <div key={transaction.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">{transaction.username}</p>
                      <p className="text-sm text-muted-foreground">
                        Requested {formatCurrency(transaction.amount)} on {formatDate(transaction.timestamp)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive border-destructive hover:bg-destructive/10"
                        onClick={() => handleRejectWithdrawal(transaction.id)}
                        disabled={isLoading}
                      >
                        <X className="h-4 w-4 mr-1" /> Reject
                      </Button>
                      <Button
                        size="sm"
                        className="bg-brand-success hover:bg-brand-success/90"
                        onClick={() => handleApproveWithdrawal(transaction.id)}
                        disabled={isLoading}
                      >
                        <Check className="h-4 w-4 mr-1" /> Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Transactions */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Transactions</TabsTrigger>
            <TabsTrigger value="contributions">Contributions</TabsTrigger>
            <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
          </TabsList>
          
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                View all financial activities in this group
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TabsContent value="all">
                {group.transactions.length > 0 ? (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">Type</TableHead>
                          <TableHead>Member</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.transactions
                          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                          .map(transaction => (
                            <TableRow key={transaction.id}>
                              <TableCell>
                                <div className="flex items-center">
                                  {getTransactionIcon(transaction)}
                                  <span className="ml-2 capitalize">{transaction.type}</span>
                                </div>
                              </TableCell>
                              <TableCell>{transaction.username}</TableCell>
                              <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                              <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                              <TableCell className="text-right">{formatDate(transaction.timestamp)}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">No transactions yet</p>
                )}
              </TabsContent>
              
              <TabsContent value="contributions">
                {group.transactions.filter(t => t.type === "contribution").length > 0 ? (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Member</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead className="text-right">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.transactions
                          .filter(t => t.type === "contribution")
                          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                          .map(transaction => (
                            <TableRow key={transaction.id}>
                              <TableCell>{transaction.username}</TableCell>
                              <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                              <TableCell className="text-right">{formatDate(transaction.timestamp)}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">No contributions yet</p>
                )}
              </TabsContent>
              
              <TabsContent value="withdrawals">
                {group.transactions.filter(t => t.type === "withdrawal").length > 0 ? (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Member</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.transactions
                          .filter(t => t.type === "withdrawal")
                          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                          .map(transaction => (
                            <TableRow key={transaction.id}>
                              <TableCell>{transaction.username}</TableCell>
                              <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                              <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                              <TableCell className="text-right">{formatDate(transaction.timestamp)}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">No withdrawals yet</p>
                )}
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default GroupDetail;
