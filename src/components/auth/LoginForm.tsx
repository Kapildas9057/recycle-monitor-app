// src/components/auth/LoginForm.tsx
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";

import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

interface LoginFormProps {
  onLogin: (user: any, role: string, employeeId: string, name: string) => void;
}

// Helper: Generate employee ID (frontend fallback; backend also generates)
const generateEmployeeId = async (role: "employee" | "admin"): Promise<string> => {
  const prefix = role === "admin" ? "ADM" : "EMP";
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `${prefix}-${timestamp}-${random}`;
};

// Helper: Validate employee ID format
const validateEmployeeId = (id: string): boolean => {
  return /^(EMP|ADM)-\d{6}-\d{3}$/.test(id.trim());
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
  const [isResetting, setIsResetting] = useState(false);

  const API_BASE = (import.meta as any).env?.VITE_API_BASE || "http://localhost:5000";

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

    if (isSignUp && password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    try {
      if (isSignUp) {
        // Sign-up flow via backend
        const payload = { email, password, name, role: userType };
        const resp = await fetch(`${API_BASE}/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err?.error || "Signup failed");
        }
        const data = await resp.json();
        const generatedId = data.employee_id || (await generateEmployeeId(userType));

        toast.success(`Account created! Your ${userType.toUpperCase()} ID is ${generatedId}.`);
        const user = { email, name, employee_id: generatedId };
        onLogin(user, userType, generatedId, name);

        setIsSignUp(false);
        setName("");
        setEmail("");
        setPassword("");
        setLoginId("");
      } else {
        // Sign-in flow via backend
        let payload: any = {};
        if (validateEmployeeId(loginId)) {
          payload.employee_id = loginId.trim();
        } else if (loginId.includes("@")) {
          // treat as email
          payload.email = loginId.trim();
        } else {
          // default to employee_id if format unknown
          payload.employee_id = loginId.trim();
        }
        payload.password = password;

        const resp = await fetch(`${API_BASE}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err?.error || "Login failed");
        }
        const body = await resp.json();
        const user = body.user || {};
        const role = body.role || user.role || "employee";
        const employeeId = user.employee_id || payload.employee_id || "";
        const nameFromServer = user.name || "";

        onLogin(user, role, employeeId, nameFromServer || user.email || "");
        toast.success(role === "admin" ? "Admin login successful" : "Login successful");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Authentication failed");
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
      // Try calling backend reset endpoint if available
      const resp = await fetch(`${API_BASE}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });
      if (!resp.ok) {
        // if endpoint not implemented, show fallback message
        toast.error("Password reset not available from client. Contact admin.");
      } else {
        toast.success("Password reset link sent!");
        setShowForgotPassword(false);
        setResetEmail("");
      }
    } catch (err) {
      console.warn(err);
      toast.error("Password reset not available. Contact admin.");
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
          <Tabs value={userType} onValueChange={(v) => setUserType(v as "employee" | "admin")}>{/*value={userType} onValueChange={(v) => setUserType(v as "employee" | "admin")*/}
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="employee">Employee</TabsTrigger>
              <TabsTrigger value="admin">Admin</TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp ? (
                <>  
                  <InputWithIcon icon={<User />} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
                  <InputWithIcon icon={<Mail />} type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <InputWithIcon icon={<Lock />} type="password" placeholder="Password (min 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} />
                </>
              ) : (
                <>  
                  <InputWithIcon icon={<IdCard />} placeholder="EMP001 or your@email.com" value={loginId} onChange={(e) => setLoginId(e.target.value)} />
                  <InputWithIcon icon={<Lock />} type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </>
              )}

              <EcoButton type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Processing..." : isSignUp ? "Sign Up" : "Sign In"}
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

      {showForgotPassword && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded p-6 w-full max-w-md">
            <h3 className="text-lg font-medium">Reset password</h3>
            <p className="text-sm text-muted-foreground">Enter your email to receive a reset link</p>
            <div className="mt-4 space-y-2">
              <InputWithIcon icon={<Mail />} placeholder="your@email.com" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} />
              <div className="flex space-x-2">
                <button className="btn" onClick={() => setShowForgotPassword(false)}>Cancel</button>
                <EcoButton className="ml-auto" disabled={isResetting} onClick={handleForgotPassword}>
                  {isResetting ? "Sending..." : "Send link"}
                </EcoButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
