import React, { useState } from "react";
import { auth, db } from "../../integrations/firebase/client";

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
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
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
} from "firebase/firestore";

import { generateEmployeeId, validateEmployeeId } from "@/utils/authHelpers";


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

  const auth = getAuth();

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
        // 🔹 SIGN UP FLOW
        const generatedId = await generateEmployeeId(userType);
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Create user docs in Firestore
        await setDoc(doc(db, "users", user.uid), {
          email,
          employee_id: generatedId,
          role: userType,
          email_verified: user.emailVerified,
          created_at: new Date().toISOString(),
        });

        await setDoc(doc(db, "user_profiles", user.uid), {
          user_id: user.uid,
          name,
          employee_id: generatedId,
          created_at: new Date().toISOString(),
        });

        await setDoc(doc(db, "user_roles", user.uid), {
          user_id: user.uid,
          role: userType,
          created_at: new Date().toISOString(),
        });

        toast.success(
          `Account created! Your ${userType.toUpperCase()} ID is ${generatedId}.`
        );

        onLogin(user, userType, generatedId, name);
        setIsSignUp(false);
        setName("");
        setEmail("");
        setPassword("");
      } else {
        // 🔹 SIGN IN FLOW
        let emailToUse = loginId.trim();

        // If employee ID, map to email
        if (validateEmployeeId(loginId)) {
          const usersRef = collection(db, "users");
          const q = query(usersRef, where("employee_id", "==", loginId));
          const querySnapshot = await getDocs(q);
          if (querySnapshot.empty) {
            toast.error("Invalid employee ID");
            setIsLoading(false);
            return;
          }
          emailToUse = querySnapshot.docs[0].data().email;
        }

        const userCredential = await signInWithEmailAndPassword(auth, emailToUse, password);
        const user = userCredential.user;

        // Fetch Firestore user details
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) throw new Error("User record not found");

        const userData = userDoc.data();
        const role = userData?.role || "employee";

        onLogin(user, role, userData.employee_id, userData.email);
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
      await sendPasswordResetEmail(auth, resetEmail);
      toast.success("Password reset link sent!");
      setShowForgotPassword(false);
      setResetEmail("");
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset link");
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
          <Tabs value={userType} onValueChange={(v) => setUserType(v as "employee" | "admin")}>
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
    </div>
  );
}
