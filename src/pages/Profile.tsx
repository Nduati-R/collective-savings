
import React from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import MainLayout from "@/components/layout/MainLayout";

const profileSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters long" }),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const Profile = () => {
  const { user, updateProfile, isAuthenticated, isLoading } = useAuth();
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.username || "",
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      await updateProfile({ username: data.username });
    } catch (error) {
      console.error("Profile update error:", error);
    }
  };

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <MainLayout>
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-6 flex items-center">
          <User className="mr-2 h-6 w-6" /> Profile Settings
        </h1>
        <Card>
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
            <CardDescription>Update your account information here.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="johndoe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div>
                  <FormLabel>Email</FormLabel>
                  <Input value={user?.email || ""} disabled />
                  <p className="text-xs text-muted-foreground mt-1">
                    Email cannot be changed at this time
                  </p>
                </div>
                <Button type="submit" className="mt-4" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center border-t">
            <p className="text-sm text-muted-foreground pt-4">
              Account created: {new Date().toLocaleDateString()}
            </p>
          </CardFooter>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Profile;
