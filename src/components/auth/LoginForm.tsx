import React, { useState } from "react";
import { UserCheck, Lock, Mail, User, IdCard } from "lucide-react";
import { InputWithIcon } from "@/components/ui/input-with-icon";
import { EcoButton } from "@/components/ui/eco-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { generateEmployeeId, getEmailByEmployeeId, validateEmployeeId } from "@/utils/authHelpers";
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
  onLogin: (user: SupabaseUser, role: string, employeeId: string, name: string) => void;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [userType, setUserType] = useState<"employee" | "admin">("employee");
  const [loginId, setLoginId] = useState(""); // Can be email or employee ID
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

  if (!isSignUp && (!loginId || !password)) {
    toast.error("Please enter both ID/email and password");
    return;
  }

  if (isSignUp && (!name || !email || !password)) {
    toast.error("Please fill in all required fields");
    return;
  }

  setIsLoading(true);

  try {
    if (isSignUp) {
      // 🟢 SIGN UP FLOW
      const generatedId = await generateEmployeeId(userType);

      // 1️⃣ Create user in Supabase Auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { name, role: userType },
        },
      });

      if (signUpError) throw signUpError;

      const authUser = signUpData?.user;

      // If no user returned, ask for email verification
      if (!authUser) {
        toast.info(
          `Account created! Please verify your email (${email}). After verification, your ${userType} ID will be ${generatedId}.`
        );
        setIsLoading(false);
        return;
      }

      // 2️⃣ Insert matching row in your "users" table
      const { error: insertError } = await supabase.from("users").insert([
        {
          id: authUser.id, // match Supabase Auth user id
          email,
          employee_id: generatedId,
          role: userType,
          password_hash: "auth-managed", // placeholder (Auth handles the real hash)
          email_verified: !!authUser.email_confirmed_at,
        },
      ]);

      if (insertError) throw insertError;

      toast.success(
        `Account created successfully! Your ${userType.toUpperCase()} ID is: ${generatedId}. Save it for login.`
      );

      // Reset form
      setIsSignUp(false);
      setName("");
      setEmail("");
      setPassword("");
    } else {
      // 🔵 SIGN IN FLOW
      let emailToUse = loginId;

      // Support login by Employee ID
      if (validateEmployeeId(loginId)) {
        const foundEmail = await getEmailByEmployeeId(loginId);
        if (!foundEmail) {
          toast.error("Invalid employee ID");
          setIsLoading(false);
          return;
        }
        emailToUse = foundEmail;
      }

      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: emailToUse,
          password,
        });

      if (signInError) throw signInError;
      const user = signInData?.user;
      if (!user) throw new Error("Sign in failed");

      // Fetch matching user info
      const { data: dbUser, error: dbError } = await supabase
        .from("users")
        .select("employee_id, role, email")
        .eq("id", user.id)
        .maybeSingle();

      if (dbError) throw dbError;
      if (!dbUser) throw new Error("User record not found in database");

      const role = dbUser.role === "admin" ? "admin" : "employee";
      onLogin(user, role, dbUser.employee_id, dbUser.email);

      toast.success(role === "admin" ? "Admin login successful" : "Login successful");
    }
  } catch (error: any) {
    console.error(error);
    toast.error(
      error.message?.includes("Invalid")
        ? "Invalid ID or password"
        : error.message || "Authentication failed"
    );
  } finally {
    setIsLoading(false);
  }
};



        // 3) Insert into public.users (app-level users table)
        const { error: insertUserErr } = await supabase.from("users").insert([
          {
            id: userId,
            email,
            employee_id: generatedId,
            role: userType,
            password_hash: "auth-managed", // placeholder; Supabase Auth stores the real hash
            email_verified: authUser.email_confirmed_at ? true : false,
          },
        ]);

        if (insertUserErr) throw insertUserErr;

        // 4) Insert into user_profiles
        const { error: profileErr } = await supabase.from("user_profiles").insert([
          {
            user_id: userId,
            name,
            employee_id: generatedId,
          },
        ]);

        if (profileErr) throw profileErr;

        // 5) Insert into user_roles
        const { error: roleErr } = await supabase.from("user_roles").insert([
          {
            user_id: userId,
            role: userType,
          },
        ]);

        if (roleErr) throw roleErr;

        // 6) Try to auto sign-in (if email confirmation not required)
        try {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (signInError) {
            // Not fatal — may require email verification. Show friendly message.
            toast.success(`Account created! Your ${userType} ID is ${generatedId}. Please verify your email before logging in.`);
          } else {
            // If signInData.user exists, proceed to fetch profile & role and call onLogin
            const signedInUser = signInData.user;
            // fetch profile and role
            const { data: profile } = await supabase
              .from("user_profiles")
              .select("*")
              .eq("user_id", signedInUser.id)
              .maybeSingle();

            const { data: roleData } = await supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", signedInUser.id)
              .maybeSingle();

            const role = roleData?.role || userType;
            onLogin(signedInUser, role, profile?.employee_id || generatedId, profile?.name || name);
            toast.success(`Welcome! Account created and signed in as ${role}.`);
          }
        } catch (err) {
          // ignore; handled above
        }

        // Reset form
        setIsSignUp(false);
        setLoginId("");
        setPassword("");
        setName("");
        setEmail("");

      } else {
        // ---------------------------
        // SIGN IN FLOW
        // ---------------------------
        let emailToUse = loginId.trim();

        // If loginId looks like employee/admin ID (EMPxxxx or ADMxxxx), resolve to email
        if (validateEmployeeId(loginId.trim())) {
          const foundEmail = await getEmailByEmployeeId(loginId.trim());
          if (!foundEmail) {
            toast.error("Invalid employee ID");
            setIsLoading(false);
            return;
          }
          emailToUse = foundEmail;
        }

        // sign in
        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
          email: emailToUse,
          password,
        });

        if (signInError) throw signInError;
        if (!authData.user) throw new Error("Sign in failed");

        // fetch profile
        const { data: profile, error: profileError } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", authData.user.id)
          .maybeSingle();

        if (profileError) throw profileError;
        if (!profile) throw new Error("User profile not found");

        // fetch role
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", authData.user.id)
          .maybeSingle();

        if (roleError) throw roleError;

        const role = roleData?.role === "admin" ? "admin" : "employee";
        onLogin(authData.user, role, profile.employee_id, profile.name);
        toast.success(role === "admin" ? "Admin login successful" : "Login successful");
      }
    } catch (error: any) {
      const errorMessage = error?.message || "Authentication failed";
      // make message user-friendly where possible
      if (errorMessage.toLowerCase().includes("invalid login") || errorMessage.toLowerCase().includes("invalid email")) {
        toast.error("Invalid ID/email or password");
      } else {
        toast.error(errorMessage);
      }
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
          <Tabs value={userType} onValueChange={(value) => setUserType(value as "employee" | "admin")}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="employee">Employee</TabsTrigger>
              <TabsTrigger value="admin">Admin</TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp ? (
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
                      placeholder="Enter your password (min 6 characters)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>

                  <div className="p-3 bg-accent/20 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      Your unique ID will be automatically generated after signup.
                      {userType === "admin" ? " (ADM format)" : " (EMP format)"}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
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
                      <label className="text-sm font-medium text-foreground">Password</label>
                      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
                        <DialogTrigger asChild>
                          <Button variant="link" className="h-auto p-0 text-xs">
                            Forgot password?
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Reset Password</DialogTitle>
                            <DialogDescription>
                              Enter your email address and we'll send you a password reset link.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <InputWithIcon
                              icon={<Mail className="w-4 h-4" />}
                              type="email"
                              placeholder="your@email.com"
                              value={resetEmail}
                              onChange={(e) => setResetEmail(e.target.value)}
                            />
                            <Button
                              onClick={handleForgotPassword}
                              disabled={isResetting}
                              className="w-full"
                            >
                              {isResetting ? "Sending..." : "Send Reset Link"}
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

              <EcoButton type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading
                  ? isSignUp
                    ? "Creating account..."
                    : "Signing in..."
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
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
              </button>
            </form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
