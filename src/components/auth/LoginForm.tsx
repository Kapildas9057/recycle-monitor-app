import React, { useState } from "react";
import { UserCheck, Lock, Mail, User, IdCard } from "lucide-react";
import { InputWithIcon } from "@/components/ui/input-with-icon";
import { EcoButton } from "@/components/ui/eco-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";

interface LoginFormProps {
  onLogin: (user: SupabaseUser, role: string, employeeId: string, name: string) => void;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [userType, setUserType] = useState<'employee' | 'admin'>('employee');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    if (isSignUp && (!name || !employeeId)) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      if (isSignUp) {
        // Sign up - profile and role will be created automatically by database trigger
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              name,
              employee_id: employeeId,
              role: userType === 'admin' ? 'admin' : 'user',
            }
          }
        });

        if (signUpError) throw signUpError;
        if (!authData.user) throw new Error("Sign up failed");

        toast.success("Account created successfully! Please sign in.");
        setIsSignUp(false);
        setEmail('');
        setPassword('');
        setName('');
        setEmployeeId('');
      } else {
        // Sign in
        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;
        if (!authData.user) throw new Error("Sign in failed");

        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', authData.user.id)
          .single();

        if (profileError) throw profileError;
        if (!profile) throw new Error("User profile not found");

        // Get user role from user_roles table
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', authData.user.id)
          .single();

        if (roleError) throw roleError;
        if (!roleData) throw new Error("User role not found");

        const role = roleData.role === 'admin' ? 'admin' : 'employee';
        onLogin(authData.user, role, profile.employee_id, profile.name);
        toast.success(role === "admin" ? "Admin login successful" : "Login successful");
      }
    } catch (error: any) {
      const errorMessage = error?.message || "Authentication failed";
      toast.error(errorMessage.includes("Invalid") ? "Invalid email or password" : "Authentication failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-eco border-card-border">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-eco rounded-xl flex items-center justify-center">
            <UserCheck className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-display text-foreground">
              {isSignUp ? "Create Account" : "Welcome to EcoShift"}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Professional waste management system
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs value={userType} onValueChange={(value) => setUserType(value as 'employee' | 'admin')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="employee">Employee</TabsTrigger>
              <TabsTrigger value="admin">Admin</TabsTrigger>
            </TabsList>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Full Name</label>
                    <InputWithIcon
                      icon={<User className="w-4 h-4" />}
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      {userType === 'admin' ? 'Admin ID' : 'Employee ID'}
                    </label>
                    <InputWithIcon
                      icon={<IdCard className="w-4 h-4" />}
                      placeholder={userType === 'admin' ? 'e.g., ADM001' : 'e.g., EMP001'}
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email</label>
                <InputWithIcon
                  icon={<Mail className="w-4 h-4" />}
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Password</label>
                <InputWithIcon
                  icon={<Lock className="w-4 h-4" />}
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              
              <EcoButton 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={isLoading}
              >
                {isLoading 
                  ? (isSignUp ? "Creating account..." : "Signing in...")
                  : (isSignUp ? "Sign Up" : "Sign In")
                }
              </EcoButton>

              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {isSignUp 
                  ? "Already have an account? Sign in" 
                  : "Don't have an account? Sign up"
                }
              </button>
            </form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
