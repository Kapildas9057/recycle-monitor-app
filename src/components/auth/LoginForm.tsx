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

// Firebase imports (KEEP ALL - YOUR PERFECT SETUP)
import { auth, db } from "@/integrations/firebase/client";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
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

interface LoginFormProps {
  onLogin: (user: FirebaseUser, role: string, employeeId: string, name: string) => void;
}

// Helper: Generate employee ID (KEEP YOUR PERFECT FORMAT)
const generateEmployeeId = async (role: "employee" | "admin"): Promise<string> => {
  const prefix = role === "admin" ? "ADM" : "EMP";
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
};

// Helper: Validate employee ID format (KEEP)
const validateEmployeeId = (id: string): boolean => {
  return /^(EMP|ADM)-\d{6}-\d{3}$/.test(id.trim());
};

// Helper: Get email by employee ID from Firestore (KEEP)
const getEmailByEmployeeId = async (employeeId: string): Promise<string | null> => {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("employee_id", "==", employeeId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const userDoc = querySnapshot.docs[0];
    return userDoc.data().email || null;
  } catch (error) {
    console.error("Error fetching email by employee ID:", error);
    return null;
  }
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

  // SUPER ADMIN credentials (hidden from UI)
  const SUPER_ADMIN_EMAIL = "kd850539@gmail.com";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation (KEEP YOUR PERFECT LOGIC)
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
        // SIGN UP FLOW (KEEP YOUR PERFECT FIREBASE)
        // ============================================

        // 1. Generate unique employee ID
        const generatedId = await generateEmployeeId(userType);

        // 2. Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 3. Update display name
        await updateProfile(user, { displayName: name });

        // 4. Create user document in Firestore (main users collection)
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: email,
          employee_id: generatedId,
          role: userType,
          email_verified: user.emailVerified,
          created_at: serverTimestamp(),
        });

        // 5. Create user profile document
        await setDoc(doc(db, "user_profiles", user.uid), {
          user_id: user.uid,
          name: name,
          employee_id: generatedId,
          created_at: serverTimestamp(),
        });

        // 6. Create user role document
        await setDoc(doc(db, "user_roles", user.uid), {
          user_id: user.uid,
          role: userType,
          created_at: serverTimestamp(),
        });

        toast.success(
          `Account created successfully! Your ${userType.toUpperCase()} ID is: ${generatedId}. Save it for login.`
        );

        // Auto-login after signup
        onLogin(user, userType, generatedId, name);

        // Reset form
        setIsSignUp(false);
        setName("");
        setEmail("");
        setPassword("");
        setLoginId("");

      } else {
        // ============================================
        // SIGN IN FLOW WITH SUPER ADMIN DETECTION
        // ============================================

        let emailToUse = loginId.trim();

        // Check if login ID is an employee/admin ID (not email)
        if (validateEmployeeId(loginId.trim())) {
          const foundEmail = await getEmailByEmployeeId(loginId.trim());
          if (!foundEmail) {
            toast.error("Invalid employee/admin ID. Please check and try again.");
            setIsLoading(false);
            return;
          }
          emailToUse = foundEmail;
        }

        // Sign in with Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, emailToUse, password);
        const user = userCredential.user;

        if (!user) {
          throw new Error("Sign in failed - no user returned");
        }

        // 🔐 CHECK FOR SUPER ADMIN (HIDDEN ROLE)
        if (user.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
          // Super Admin detected - bypass role checking
          onLogin(user, "super_admin", "SUPER-ADMIN", "Super Admin");
          toast.success("🔐 Super Admin Access Granted");
          setIsLoading(false);
          return;
        }

        // Fetch user data from Firestore (auto-provision if missing)
        const userDocRef = doc(db, "users", user.uid);
        let userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          // Auto-create minimal records for existing Auth users
          const generatedId = await generateEmployeeId(userType);
          const createdUserData = {
            uid: user.uid,
            email: user.email ?? emailToUse,
            employee_id: generatedId,
            role: userType,
            email_verified: user.emailVerified,
            created_at: serverTimestamp(),
          };
          await setDoc(userDocRef, createdUserData);

          // Also initialize profile and role docs if missing
          const profileDocRef = doc(db, "user_profiles", user.uid);
          await setDoc(profileDocRef, {
            user_id: user.uid,
            name: user.displayName || (user.email?.split("@")[0] ?? "User"),
            employee_id: generatedId,
            created_at: serverTimestamp(),
          });

          const roleDocRefInit = doc(db, "user_roles", user.uid);
          await setDoc(roleDocRefInit, {
            user_id: user.uid,
            role: userType,
            created_at: serverTimestamp(),
          });

          userDocSnap = await getDoc(userDocRef);
        }

        const userData = userDocSnap.data();

        // Fetch user profile
        const profileDocRef = doc(db, "user_profiles", user.uid);
        const profileDocSnap = await getDoc(profileDocRef);

        const userName = profileDocSnap.exists() ? profileDocSnap.data().name : userData.email;

        // Fetch user role
        const roleDocRef = doc(db, "user_roles", user.uid);
        const roleDocSnap = await getDoc(roleDocRef);

        const role = roleDocSnap.exists() ? roleDocSnap.data().role : userData.role;

        // Ensure role matches selected user type
        if (role !== userType) {
          toast.error(`This account is registered as ${role}, not ${userType}. Please select the correct role.`);
          await auth.signOut();
          setIsLoading(false);
          return;
        }

        const employeeId = userData.employee_id || "N/A";

        // Call onLogin callback
        onLogin(user, role, employeeId, userName);

        toast.success(role === "admin" ? "Admin login successful" : "Login successful");
      }

    } catch (error: any) {
      console.error("Authentication error:", error);

      // Handle specific Firebase errors (KEEP YOUR PERFECT HANDLING)
      let errorMessage = "Authentication failed";

      if (error.code === "auth/email-already-in-use") {
        errorMessage = "This email is already registered. Please sign in instead.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email format";
      } else if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email/ID";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect password";
      } else if (error.code === "auth/invalid-credential") {
        errorMessage = "Invalid email/ID or password";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password should be at least 6 characters";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);

    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail || !resetEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsResetting(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      toast.success("Password reset link sent to your email! Please check your inbox.");
      setShowForgotPassword(false);
      setResetEmail("");
    } catch (error: any) {
      console.error("Password reset error:", error);

      let errorMessage = "Failed to send reset email";
      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsResetting(false);
    }
  };

  // ✅ YOUR PERFECT UI (KEEP 100% - NO CHANGES!)
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
                      {userType === "admin" ? "Admin ID or Email" : "Employee ID or Email"}
                    </label>
                    <InputWithIcon
                      icon={<IdCard className="w-4 h-4" />}
                      placeholder={userType === "admin" ? "ADM-123456-789 or admin@email.com" : "EMP-123456-789 or your@email.com"}
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