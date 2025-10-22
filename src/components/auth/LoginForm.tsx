// src/components/auth/LoginForm.tsx
import React, { useState } from "react";
import { auth, db } from "@/integrations/firebase/client";

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";

import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp
} from "firebase/firestore";

import { generateEmployeeId, validateEmployeeId, getEmailByEmployeeId } from "@/utils/authHelpers";

interface LoginFormProps {
  onLogin: (user: FirebaseUser, role: string, employeeId: string, name: string) => void;
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

    // validation
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
        // SIGN UP
        const generatedId = await generateEmployeeId(userType);
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // create documents in Firestore
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email,
          employee_id: generatedId,
          role: userType,
          email_verified: user.emailVerified,
          created_at: serverTimestamp(),
        });

        await setDoc(doc(db, "user_profiles", user.uid), {
          user_id: user.uid,
          name,
          employee_id: generatedId,
          created_at: serverTimestamp(),
        });

        await setDoc(doc(db, "user_roles", user.uid), {
          user_id: user.uid,
          role: userType,
          created_at: serverTimestamp(),
        });

        toast.success(`Account created! Your ID: ${generatedId}.`);
        onLogin(user, userType, generatedId, name);

        setIsSignUp(false);
        setName("");
        setEmail("");
        setPassword("");
      } else {
        // SIGN IN
        let emailToUse = loginId.trim();

        if (validateEmployeeId(loginId.trim())) {
          // map employee id to email
          const maybeEmail = await getEmailByEmployeeId(loginId.trim());
          if (!maybeEmail) {
            toast.error("Invalid employee ID");
            setIsLoading(false);
            return;
          }
          emailToUse = maybeEmail;
        }

        const { user } = await signInWithEmailAndPassword(auth, emailToUse, password);

        // load user doc from Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) {
          toast.error("User record not found");
          setIsLoading(false);
          return;
        }
        const ud = userDoc.data();
        const role = ud.role ?? "employee";

        onLogin(user, role, ud.employee_id, ud.email);
        toast.success(role === "admin" ? "Admin login successful" : "Login successful");
      }
    } catch (err: any) {
      console.error(err);
      // Firebase error codes: user-not-found, wrong-password, invalid-email, etc.
      const msg = err?.code ? `${err.code}: ${err.message}` : err?.message || "Authentication failed";
      toast.error(msg);
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
      await sendPasswordResetEmail(auth, resetEmail);
      toast.success("Password reset link sent!");
      setShowForgotPassword(false);
      setResetEmail("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to send reset link");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen ..."> {/* keep your existing styling */}
      <Card className="w-full max-w-md ...">
        <CardHeader className="text-center space-y-4">
          <div className="...">
            <UserCheck className="w-8 h-8" />
          </div>
          <div>
            <CardTitle>{isSignUp ? "Create Account" : "Welcome to EcoShift"}</CardTitle>
            <CardDescription>Professional waste management system</CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={userType} onValueChange={(v) => setUserType(v as any)}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="employee">Employee</TabsTrigger>
              <TabsTrigger value="admin">Admin</TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* sign-up fields */}
              {isSignUp ? (
                <>
                  <InputWithIcon icon={<User />} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
                  <InputWithIcon icon={<Mail />} type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <InputWithIcon icon={<Lock />} type="password" placeholder="Password (min 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} />
                </>
              ) : (
                <>
                  <InputWithIcon icon={<IdCard />} placeholder="EMP-000001 or your@email.com" value={loginId} onChange={(e) => setLoginId(e.target.value)} />
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
                className="w-full text-sm ..."
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
