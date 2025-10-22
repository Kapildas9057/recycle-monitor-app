import React, { useState } from "react";
import { UserCheck, Lock, Mail, User, IdCard } from "lucide-react";
import { InputWithIcon } from "@/components/ui/input-with-icon";
import { EcoButton } from "@/components/ui/eco-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// ✅ NEW: Backend API calls
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface LoginFormProps {
  onLogin: (user: { id: string; name: string; email: string; employee_id: string; role: string },
            role: string,
            employeeId: string,
            name: string) => void;
}

// ✅ KEEP YOUR PERFECT ID GENERATOR
const generateEmployeeId = async (role: "employee" | "admin"): Promise<string> => {
  const prefix = role === "admin" ? "ADM" : "EMP";
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
};

// ✅ Backend API helpers
const apiSignup = async (email: string, password: string, name: string, role: 'employee' | 'admin') => {
  const response = await fetch(`${API_URL}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name, role })
  });
  return response.json();
};

const apiLogin = async (employeeId: string, password: string) => {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employee_id: employeeId, password })
  });
  return response.json();
};

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ SAME VALIDATION (KEEP PERFECT UX)
    if (!isSignUp && (!loginId || !password)) {
      toast.error("Please enter both ID/email and password");
      return;
    }

    if (isSignUp && (!name || !email || !password)) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (isSignUp && password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        // ============================================
        // ✅ NEW: BACKEND SIGNUP (Supabase + Triggers)
        // ============================================

        const generatedId = await generateEmployeeId(userType);

        const result = await apiSignup(email, password, name, userType);

        if (result.error) {
          throw new Error(result.error);
        }

        toast.success(
          `🎉 Account created successfully! Your ${userType.toUpperCase()} ID is: ${result.employee_id}. Save it for login.`
        );

        // ✅ Auto-login after signup
        onLogin(
          {
            id: 'temp',
            name,
            email,
            employee_id: result.employee_id,
            role: userType
          },
          userType,
          result.employee_id,
          name
        );

        // Reset form
        setIsSignUp(false);
        setName("");
        setEmail("");
        setPassword("");
        setLoginId("");

      } else {
        // ============================================
        // ✅ NEW: BACKEND LOGIN (employee_id → Supabase)
        // ============================================

        // Backend handles ID lookup automatically
        const result = await apiLogin(loginId.trim(), password);

        if (result.error) {
          throw new Error(result.error);
        }

        const { user, role } = result;

        onLogin(user, role, user.employee_id, user.name);
        toast.success(role === "admin" ? "👑 Admin login successful" : "✅ Employee login successful");
      }

    } catch (error: any) {
      console.error("Authentication error:", error);
      toast.error(error.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Simplified forgot password (email lookup via backend later)
  const handleForgotPassword = async () => {
    if (!resetEmail || !resetEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    toast.info("Contact admin for password reset (custom auth system)");
    setShowForgotPassword(false);
    setResetEmail("");
  };

  // ✅ PERFECT UI = 100% UNCHANGED
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
                      {userType === "admin" ? " (ADM-XXXXXX-XXX format)" : " (EMP-XXXXXX-XXX format)"}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      {userType === "admin" ? "Admin ID" : "Employee ID"}
                    </label>
                    <InputWithIcon
                      icon={<IdCard className="w-4 h-4" />}
                      placeholder={userType === "admin" ? "ADM-123456-789" : "EMP-123456-789"}
                      value={loginId}
                      onChange={(e) => setLoginId(e.target.value.toUpperCase())}
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
                            <DialogTitle>Password Reset</DialogTitle>
                            <DialogDescription>
                              Enter your email address for reset instructions.
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
                              className="w-full"
                            >
                              Send Reset Instructions
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