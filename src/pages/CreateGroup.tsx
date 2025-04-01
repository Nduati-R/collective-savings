
import React from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useGroups } from "@/context/GroupContext";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import MainLayout from "@/components/layout/MainLayout";

const createGroupSchema = z.object({
  name: z.string().min(3, { message: "Group name must be at least 3 characters long" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters long" }),
  targetAmount: z
    .string()
    .min(1, { message: "Target amount is required" })
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Target amount must be a positive number",
    }),
});

type CreateGroupFormValues = z.infer<typeof createGroupSchema>;

const CreateGroup = () => {
  const { isAuthenticated, user } = useAuth();
  const { createGroup, isLoading } = useGroups();
  const navigate = useNavigate();
  
  const form = useForm<CreateGroupFormValues>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: "",
      description: "",
      targetAmount: "",
    },
  });

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const onSubmit = async (data: CreateGroupFormValues) => {
    if (!user) return;
    
    try {
      await createGroup({
        name: data.name,
        description: data.description,
        targetAmount: Number(data.targetAmount),
        admin: user.id,
        members: [{ id: user.id, username: user.username }],
      });
      
      navigate("/groups");
    } catch (error) {
      console.error("Group creation error:", error);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/groups")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Groups
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Create New Savings Group</h1>
          <p className="text-muted-foreground">
            Set up a new group for you and your friends to save together
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Group Details</CardTitle>
            <CardDescription>
              Fill out the information below to create your new savings group
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Group Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Vacation Fund, Home Deposit" {...field} />
                      </FormControl>
                      <FormDescription>
                        Choose a name that represents your savings goal
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe what your group is saving for..." 
                          className="min-h-[100px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Explain the purpose of this group to potential members
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="targetAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Amount</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                          <Input className="pl-7" placeholder="5000" {...field} />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Set the total amount your group aims to save
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="pt-4 flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="mr-2"
                    onClick={() => navigate("/groups")}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                      </>
                    ) : (
                      "Create Group"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default CreateGroup;
