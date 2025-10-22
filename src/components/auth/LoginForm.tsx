import React, { useState } from "react";
import { UserCheck, Lock, Mail, User, IdCard } from "lucide-react";
import { InputWithIcon } from "@/components/ui/input-with-icon";
import { EcoButton } from "@/components/ui/eco-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/firebase.config"; // ✅ Fixed import path
import { User as SupabaseUser } from "@supabase/supabase-js";
import {
  generateEmployeeId,
  getEmailByEmployeeId,
  validateEmployeeId,
} from "@/utils/authHelpers";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface LoginFormProps {
  onLogin: (
    user: SupabaseUser,
    role: string,
    employeeId: string,
    name: string
  ) => void;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [userType, setUserType] = useState<"employee" | "admin">("employee");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!loginId || !password) {
      toast.error("Please enter both ID and password");
      return;
    }

    if (isSignUp && (!name || !email)) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      if (isSignUp) {
        const generatedId = await generateEmployeeId(userType);

        const { data: authData, error: signUpError } =
          await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/`,
              data: {
                name,
                employee_id: generatedId,
              },
            },
          });

        if (signUpError) throw signUpError;
        if (!authData.user) throw new Error("Sign up failed");

        toast.success(
          `Account created successfully! Your ID: ${generatedId}. Please save it for login.`
        );

        setIsSignUp(false);
        setLoginId("");
        setPassword("");
        setName("");
        setEmail("");
      } else {
        let emailToUse = loginId;

        if (validateEmployeeId(loginId)) {
          const foundEmail = await getEmailByEmployeeId(loginId);
          if (!foundEmail) {
            toast.error("Invalid employee ID");
            setIsLoading(false);
            return;
          }
          emailToUse = foundEmail;
        }

        const { data: authData, error: signInError } =
          await supabase.auth.signInWithPassword({
            email: emailToUse,
            password,
          });

        if (signInError) throw signInError;
        if (!authData.user) throw new Error("Sign in failed");

        const { data: profile, error: profileError } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", authData.user.id)
          .maybeSingle();

        if (profileError) throw profileError;
        if (!profile) throw new Error("User profile not found");

        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", authData.user.id)
          .maybeSingle();

        if (roleError) throw roleError;

        const role = roleData?.role === "admin" ? "admin" : "employee";

        onLogin(authData.user, role, profile.employee_id, profile.name);
        toast.success(
          role === "admin" ? "Admin login successful" : "Login successful"
        );
      }
    } catch (error: any) {
      const message = error?.message || "Authentication failed";
      toast.error(
        message.includes("Invalid")
          ? "Invalid ID or password"
          : "Authentication failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      toast.error("Please enter your email address");
      return;
    }

    setIsResetting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/`,
      });

      if (error) throw error;

      toast.success("Password reset link sent to your email!");
      setShowForgotPassword(false);
      setResetEmail("");
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset email");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/40 to-accent/30 flex items-center justify-center p-6">
      <Card className="w-full max-w-md bg-card/90 backdrop-blur-md shadow-2xl border border-border/50 rounded-2xl transition-all duration-300 hover:shadow-3xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-primary to-emerald-500 rounded-2xl flex items-center justify-center shadow-md">
            <UserCheck className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-3xl font-display text-foreground tracking-tight">
              {isSignUp ? "Create Your Account" : "Welcome to EcoShift"}
            </CardTitle>
            <CardDescription className="text-muted-foreground text-sm">
              Smart & Sustainable Waste Management
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs
            value={userType}
            onValueChange={(v) => setUserType(v as "employee" | "admin")}
            className="transition-all duration-300"
          >
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="employee">Employee</TabsTrigger>
              <TabsTrigger value="admin">Admin</TabsTrigger>
            </TabsList>

            <TabsContent value={userType}>
              <form onSubmit={handleSubmit} className="space-y-5">
                {isSignUp ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground">
                        Full Name
                      </label>
                      <InputWithIcon
                        icon={<User className="w-4 h-4" />}
                        placeholder="Enter your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground">
                        Email
                      </label>
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
                      <label className="text-sm font-semibold text-foreground">
                        Password
                      </label>
                      <InputWithIcon
                        icon={<Lock className="w-4 h-4" />}
                        type="password"
                        placeholder="Enter password (min 6 chars)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>

                    <div className="p-3 bg-accent/20 rounded-xl text-xs text-muted-foreground">
                      Your unique ID will be auto-generated after signup —{" "}
                      {userType === "admin" ? "ADM" : "EMP"} format.
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground">
                        Employee/Admin ID or Email
                      </label>
                      <InputWithIcon
                        icon={<IdCard className="w-4 h-4" />}
                        placeholder="EMP001 or your@email.com"
                        value={loginId}
                        onChange={(e) => setLoginId(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-foreground">
                          Password
                        </label>
                        <Dialog
                          open={showForgotPassword}
                          onOpenChange={setShowForgotPassword}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="link"
                              className="h-auto p-0 text-xs text-primary hover:underline"
                            >
                              Forgot password?
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Reset Password</DialogTitle>
                              <DialogDescription>
                                Enter your registered email and we’ll send you a
                                password reset link.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                              <InputWithIcon
                                icon={<Mail className="w-4 h-4" />}
                                type="email"
                                placeholder="your@email.com"
                                value={resetEmail}
                                onChange={(e) =>
                                  setResetEmail(e.target.value)
                                }
                              />
                              <Button
                                onClick={handleForgotPassword}
                                disabled={isResetting}
                                className="w-full"
                              >
                                {isResetting
                                  ? "Sending..."
                                  : "Send Reset Link"}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>

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
                  </>
                )}

                <EcoButton
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading
                    ? isSignUp
                      ? "Creating Account..."
                      : "Signing In..."
                    : isSignUp
                    ? "Sign Up"
                    : "Sign In"}
                </EcoButton>

                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setLoginId("");
                    setPassword("");
                    setName("");
                    setEmail("");
                  }}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition"
                >
                  {isSignUp
                    ? "Already have an account? Sign in"
                    : "Don't have an account? Sign up"}
                </button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
