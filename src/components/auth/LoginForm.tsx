import React, { useState } from "react";
import { UserCheck, Lock, Mail, User, IdCard } from "lucide-react";
import { InputWithIcon } from "@/components/ui/input-with-icon";
import { EcoButton } from "@/components/ui/eco-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTamilText } from "@/hooks/useTamilText";

// Firebase imports
import { auth } from "@/integrations/firebase/client";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp
} from "firebase/firestore";

const fdb = getFirestore();

interface LoginFormProps {
  onLogin: (user: FirebaseUser, role: string, employee_id: string, name: string) => void;
}

// Generate ID
const generateemployee_id = async (role: "employee" | "admin"): Promise<string> => {
  const prefix = role === "admin" ? "ADM" : "EMP";
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
};

// Validate ID format
const validateemployee_id = (id: string): boolean => {
  return /^(EMP|ADM)-\d{6}-\d{3}$/.test(id.trim());
};

// Get email by employee/admin ID
const getEmailByemployee_id = async (employee_id: string): Promise<string | null> => {
  try {
    if (!employee_id) return null;
    const usersRef = collection(fdb, "users");
    const q = query(usersRef, where("employee_id", "==", employee_id));
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
  const t = useTamilText();
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

  const SUPER_ADMIN_EMAIL = "kd850539@gmail.com";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSignUp && (!loginId || !password)) {
      const msg = userType === "employee" ? t("please_enter_id_password") : "Please enter both ID/email and password";
      toast.error(msg);
      return;
    }

    if (isSignUp && (!name || !email || !password)) {
      const msg = userType === "employee" ? t("please_fill_required") : "Please fill in all required fields";
      toast.error(msg);
      return;
    }

    if (isSignUp && password.length < 6) {
      const msg = userType === "employee" ? t("password_min_6") : "Password must be at least 6 characters";
      toast.error(msg);
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        // SIGN UP FLOW
        const generatedId = await generateemployee_id(userType);
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, { displayName: name });

        await setDoc(doc(fdb, "approval_requests", user.uid), {
          uid: user.uid,
          email: email,
          name: name,
          employee_id: generatedId,
          role: userType,
          status: "pending",
          created_at: serverTimestamp(),
        });

        const successMsg = userType === "employee"
          ? `${t("account_created")} ${generatedId}. ${t("approval_pending")}`
          : `Account created successfully! Your ${userType.toUpperCase()} ID is: ${generatedId}. Awaiting Super Admin approval.`;

        toast.success(successMsg);
        await auth.signOut();

        setIsSignUp(false);
        setName("");
        setEmail("");
        setPassword("");
        setLoginId("");

      } else {
        // ================
        // SIGN IN FLOW FIX
        // ================

        let emailToUse = loginId.trim();

        // If ID format, convert to email
        if (validateemployee_id(loginId.trim())) {
          const foundEmail = await getEmailByemployee_id(loginId.trim());
          if (!foundEmail) {
            toast.error(userType === "employee" ? t("invalid_employee_id") : "Invalid admin/employee ID.");
            setIsLoading(false);
            return;
          }
          emailToUse = foundEmail;
        } else {
          // If not ID, check valid email format
          const isValidEmail =
            emailToUse.includes("@") &&
            emailToUse.includes(".") &&
            emailToUse.length > 5;

          if (!isValidEmail) {
            toast.error("Please enter a valid email address or employee ID");
            setIsLoading(false);
            return;
          }
        }

        // SIGN IN
        const userCredential = await signInWithEmailAndPassword(auth, emailToUse, password);
        const user = userCredential.user;

        if (!user) throw new Error("Sign in failed - no user returned");

        // IMPORTANT FIX:
        // Force refresh ID token immediately after sign-in so Firestore security rules
        // receive the latest token (with email claim). This prevents "missing permissions".
        try {
          await user.getIdToken(true);
        } catch (tokenErr) {
          console.warn("Failed to refresh ID token after sign-in:", tokenErr);
          // Continue anyway; the following checks may still work
        }

        // SUPER ADMIN
        if (user.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
          onLogin(user, "super_admin", "SUPER-ADMIN", "Super Admin");
          toast.success("🔐 Super Admin Access Granted");
          setIsLoading(false);
          return;
        }

        const approvalDocRef = doc(fdb, "approval_requests", user.uid);
        const approvalDocSnap = await getDoc(approvalDocRef);

        if (!approvalDocSnap.exists()) {
          toast.error("Account not found. Please sign up first.");
          await auth.signOut();
          setIsLoading(false);
          return;
        }

        const approvalData = approvalDocSnap.data();

        if (approvalData.status === "pending") {
          toast.error("Your account is awaiting Super Admin approval.");
          await auth.signOut();
          setIsLoading(false);
          return;
        }

        if (approvalData.status === "rejected") {
          toast.error("Your account was rejected.");
          await auth.signOut();
          setIsLoading(false);
          return;
        }

        const profileDocRef = doc(fdb, "user_profiles", user.uid);
        const profileDocSnap = await getDoc(profileDocRef);

        if (!profileDocSnap.exists()) {
          toast.error("Profile not found.");
          await auth.signOut();
          setIsLoading(false);
          return;
        }

        const profileData = profileDocSnap.data();
        const userName =
          profileData.name ||
          user.displayName ||
          user.email?.split("@")[0] ||
          "User";

        const roleDocRef = doc(fdb, "user_roles", user.uid);
        const roleDocSnap = await getDoc(roleDocRef);

        if (!roleDocSnap.exists()) {
          toast.error("Role not found.");
          await auth.signOut();
          setIsLoading(false);
          return;
        }

        const role = roleDocSnap.data().role;

        if (role !== userType) {
          toast.error(`This account is registered as ${role}, not ${userType}.`);
          await auth.signOut();
          setIsLoading(false);
          return;
        }

        const employee_id = profileData.employee_id || approvalData.employee_id || "N/A";

        onLogin(user, role, employee_id, userName);

        toast.success(
          role === "admin"
            ? "Admin login successful"
            : userType === "employee"
            ? t("login_successful")
            : "Login successful"
        );
      }

    } catch (error: any) {
      console.error("Authentication error:", error);

      let errorMessage = userType === "employee" ? t("authentication_failed") : "Authentication failed";

      if (error.code === "auth/email-already-in-use") {
        errorMessage = userType === "employee" ? t("email_already_registered") : "Email already registered.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = userType === "employee" ? t("invalid_email") : "Invalid email format";
      } else if (error.code === "auth/user-not-found") {
        errorMessage = userType === "employee" ? t("no_account_found") : "No account found";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = userType === "employee" ? t("incorrect_password") : "Incorrect password";
      } else if (error.code === "auth/invalid-credential") {
        errorMessage = userType === "employee" ? t("invalid_email_or_password") : "Invalid email or password";
      } else if (error.code === "auth/weak-password") {
        errorMessage = userType === "employee" ? t("weak_password") : "Weak password";
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
      const msg = userType === "employee" ? t("enter_valid_email") : "Please enter a valid email address";
      toast.error(msg);
      return;
    }

    setIsResetting(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      toast.success(
        userType === "employee"
          ? t("reset_link_sent")
          : "Password reset link sent!"
      );
      setShowForgotPassword(false);
      setResetEmail("");
    } catch (error: any) {
      console.error("Password reset error:", error);

      let errorMessage =
        userType === "employee" ? t("failed_to_send_reset") : "Failed to send reset email";

      if (error.code === "auth/user-not-found") {
        errorMessage =
          userType === "employee" ? t("no_account_found") : "No account found";
      } else if (error.code === "auth/invalid-email") {
        errorMessage =
          userType === "employee" ? t("invalid_email") : "Invalid email";
      }

      toast.error(errorMessage);
    } finally {
      setIsResetting(false);
    }
  };

  // UI — untouched
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-eco border-card-border">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-eco rounded-xl flex items-center justify-center">
            <UserCheck className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-display text-foreground" style={userType === "employee" ? { fontFamily: "'Noto Sans Tamil', sans-serif" } : undefined}>
              {isSignUp
                ? (userType === "employee" ? t("create_account") : "Create Account")
                : (userType === "employee" ? t("welcome_ecoshift") : "Welcome to EcoShift")}
            </CardTitle>
            <CardDescription className="text-muted-foreground" style={userType === "employee" ? { fontFamily: "'Noto Sans Tamil', sans-serif" } : undefined}>
              {userType === "employee" ? t("professional_waste_system") : "Professional waste management system"}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={userType} onValueChange={(value) => setUserType(value as "employee" | "admin")}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="employee" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>{t("employee")}</TabsTrigger>
              <TabsTrigger value="admin">Admin</TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* SIGN UP UI — untouched */}
              {isSignUp ? (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" style={userType === "employee" ? { fontFamily: "'Noto Sans Tamil', sans-serif" } : undefined}>
                      {userType === "employee" ? t("full_name") : "Full Name"}
                    </label>
                    <InputWithIcon
                      icon={<User className="w-4 h-4" />}
                      placeholder={userType === "employee" ? t("enter_full_name") : "Enter your full name"}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      style={userType === "employee" ? { fontFamily: "'Noto Sans Tamil', sans-serif" } : undefined}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" style={userType === "employee" ? { fontFamily: "'Noto Sans Tamil', sans-serif" } : undefined}>
                      {userType === "employee" ? t("email") : "Email"}
                    </label>
                    <InputWithIcon
                      icon={<Mail className="w-4 h-4" />}
                      type="email"
                      placeholder={userType === "employee" ? t("your_email") : "your@email.com"}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      style={userType === "employee" ? { fontFamily: "'Noto Sans Tamil', sans-serif" } : undefined}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" style={userType === "employee" ? { fontFamily: "'Noto Sans Tamil', sans-serif" } : undefined}>
                      {userType === "employee" ? t("password") : "Password"}
                    </label>
                    <InputWithIcon
                      icon={<Lock className="w-4 h-4" />}
                      type="password"
                      placeholder={
                        userType === "employee"
                          ? `${t("enter_password")} (${t("min_6_chars")})`
                          : "Enter your password (min 6 characters)"
                      }
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      style={userType === "employee" ? { fontFamily: "'Noto Sans Tamil', sans-serif" } : undefined}
                    />
                  </div>

                  <div className="p-3 bg-accent/20 rounded-lg">
                    <p className="text-xs text-muted-foreground" style={userType === "employee" ? { fontFamily: "'Noto Sans Tamil', sans-serif" } : undefined}>
                      {userType === "employee"
                        ? `${t("id_auto_generated")} ${t("emp_format")}`
                        : `Your unique ID will be automatically generated after signup.${userType === "admin" ? " (ADM-XXXXXX-XXX format)" : " (EMP-XXXXXX-XXX format)"}`}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {/* SIGN IN UI — untouched */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" style={userType === "employee" ? { fontFamily: "'Noto Sans Tamil', sans-serif" } : undefined}>
                      {userType === "admin" ? "Admin ID or Email" : t("employee_id_or_email")}
                    </label>
                    <InputWithIcon
                      icon={<IdCard className="w-4 h-4" />}
                      placeholder={userType === "admin" ? "ADM-123456-789 or admin@email.com" : t("emp_id_placeholder")}
                      value={loginId}
                      onChange={(e) => setLoginId(e.target.value)}
                      required
                      style={userType === "employee" ? { fontFamily: "'Noto Sans Tamil', sans-serif" } : undefined}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-foreground" style={userType === "employee" ? { fontFamily: "'Noto Sans Tamil', sans-serif" } : undefined}>
                        {userType === "employee" ? t("password") : "Password"}
                      </label>

                      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
                        <DialogTrigger asChild>
                          <Button variant="link" className="h-auto p-0 text-xs" style={userType === "employee" ? { fontFamily: "'Noto Sans Tamil', sans-serif" } : undefined}>
                            {userType === "employee" ? t("forgot_password") : "Forgot password?"}
                          </Button>
                        </DialogTrigger>

                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle style={userType === "employee" ? { fontFamily: "'Noto Sans Tamil', sans-serif" } : undefined}>
                              {userType === "employee" ? t("reset_password") : "Reset Password"}
                            </DialogTitle>
                            <DialogDescription style={userType === "employee" ? { fontFamily: "'Noto Sans Tamil', sans-serif" } : undefined}>
                              {userType === "employee" ? t("reset_description") : "Enter your email address and we'll send a reset link."}
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-4 pt-4">
                            <InputWithIcon
                              icon={<Mail className="w-4 h-4" />}
                              type="email"
                              placeholder={userType === "employee" ? t("your_email") : "your@email.com"}
                              value={resetEmail}
                              onChange={(e) => setResetEmail(e.target.value)}
                              style={userType === "employee" ? { fontFamily: "'Noto Sans Tamil', sans-serif" } : undefined}
                            />

                            <Button
                              onClick={handleForgotPassword}
                              disabled={isResetting}
                              className="w-full"
                              style={userType === "employee" ? { fontFamily: "'Noto Sans Tamil', sans-serif" } : undefined}
                            >
                              {isResetting
                                ? (userType === "employee" ? t("sending") : "Sending...")
                                : (userType === "employee" ? t("send_reset_link") : "Send Reset Link")}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>

                    <InputWithIcon
                      icon={<Lock className="w-4 h-4" />}
                      type="password"
                      placeholder={userType === "employee" ? t("enter_password") : "Enter your password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      style={userType === "employee" ? { fontFamily: "'Noto Sans Tamil', sans-serif" } : undefined}
                    />
                  </div>
                </>
              )}

              <EcoButton
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading}
                style={userType === "employee" ? { fontFamily: "'Noto Sans Tamil', sans-serif" } : undefined}
              >
                {isLoading
                  ? isSignUp
                    ? (userType === "employee" ? t("creating_account") : "Creating account...")
                    : (userType === "employee" ? t("signing_in") : "Signing in...")
                  : isSignUp
                  ? (userType === "employee" ? t("sign_up") : "Sign Up")
                  : (userType === "employee" ? t("sign_in") : "Sign In")}
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
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                style={userType === "employee" ? { fontFamily: "'Noto Sans Tamil', sans-serif" } : undefined}
              >
                {isSignUp ? (
                  userType === "employee" ? (
                    <>
                      {t("already_have_account")} <span className="text-primary font-medium">{t("sign_in")}</span>
                    </>
                  ) : (
                    <>
                      Already have an account? <span className="text-primary font-medium">Sign In</span>
                    </>
                  )
                ) : (
                  userType === "employee" ? (
                    <>
                      {t("no_account")} <span className="text-primary font-medium">{t("sign_up")}</span>
                    </>
                  ) : (
                    <>
                      Don&apos;t have an account? <span className="text-primary font-medium">Sign Up</span>
                    </>
                  )
                )}
              </button>
            </form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

