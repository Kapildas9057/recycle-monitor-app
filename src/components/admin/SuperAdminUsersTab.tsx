import React, { useState, useEffect } from "react";
import { UserPlus, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { auth } from "@/integrations/firebase/client";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  deleteDoc, 
  doc, 
  setDoc, 
  serverTimestamp,
  query,
  orderBy
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";

const fdb = getFirestore();

interface UserData {
  id: string;
  email?: string;
  employee_id?: string;
  name?: string;
  role?: string;
  created_at?: any;
}

export default function SuperAdminUsersTab({ onRefresh }: { onRefresh: () => void }) {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    name: "",
    role: "employee",
  });

  useEffect(() => {
    loadUsers();
  }, []);

  // -----------------------------
  // LOAD USERS - Fixed to load from user_profiles with proper joins
  // -----------------------------
  const loadUsers = async () => {
    setLoading(true);
    try {
      // Load from user_profiles (the source of truth)
      const profilesSnap = await getDocs(
        query(collection(fdb, "user_profiles"), orderBy("created_at", "desc"))
      );
      
      const usersData: UserData[] = [];
      
      for (const profileDoc of profilesSnap.docs) {
        const profile = profileDoc.data();
        const userId = profile.user_id || profileDoc.id;
        
        // Get role from user_roles collection
        let role = "employee";
        try {
          const roleSnap = await getDocs(
            query(collection(fdb, "user_roles"))
          );
          const roleDoc = roleSnap.docs.find(d => d.data().user_id === userId);
          if (roleDoc) {
            role = roleDoc.data().role;
          }
        } catch (e) {
          console.warn("Could not load role for user:", userId);
        }
        
        // Get email from users collection if exists
        let email = "";
        try {
          const usersSnap = await getDocs(collection(fdb, "users"));
          const userDoc = usersSnap.docs.find(d => d.id === userId);
          if (userDoc) {
            email = userDoc.data().email || "";
          }
        } catch (e) {
          console.warn("Could not load email for user:", userId);
        }
        
        usersData.push({
          id: userId,
          email: email || profile.email || "",
          employee_id: profile.employee_id || "",
          name: profile.name || "",
          role: role,
          created_at: profile.created_at,
        });
      }
      
      setUsers(usersData);
      onRefresh();
    } catch (error) {
      console.error("Failed to load users:", error);
      toast.error("Failed to load users. Check permissions.");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // EMPLOYEE ID GENERATOR
  // -----------------------------
  const generateEmployeeId = (role: string) => {
    const prefix = role === "admin" ? "ADM" : "EMP";
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${timestamp}-${random}`;
  };

  // -----------------------------------------------------
  // FIXED USER CREATION - Uses Firebase Auth directly
  // -----------------------------------------------------
  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.name) {
      toast.error("Please fill all required fields.");
      return;
    }

    if (newUser.password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setIsCreating(true);

    try {
      const employee_id = generateEmployeeId(newUser.role);

      // Store current user to restore later
      const currentUser = auth.currentUser;
      
      // Create new user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newUser.email,
        newUser.password
      );
      const uid = userCredential.user.uid;

      // CRITICAL: Save to all required collections with correct structure
      
      // 1. Save to users collection (for email lookup)
      await setDoc(doc(fdb, "users", uid), {
        email: newUser.email,
        employee_id: employee_id,
        role: newUser.role,
        created_at: serverTimestamp(),
      });

      // 2. Save to user_profiles (MUST include user_id field!)
      await setDoc(doc(fdb, "user_profiles", uid), {
        user_id: uid, // CRITICAL: This was missing!
        name: newUser.name,
        employee_id: employee_id,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });

      // 3. Save to user_roles
      await setDoc(doc(fdb, "user_roles", uid), {
        user_id: uid, // Also add user_id for consistency
        role: newUser.role,
        created_at: serverTimestamp(),
      });

      // 4. Auto-approve this user (since admin created them)
      await setDoc(doc(fdb, "approval_requests", uid), {
        uid: uid,
        email: newUser.email,
        name: newUser.name,
        employee_id: employee_id,
        role: newUser.role,
        status: "approved", // Auto-approve admin-created users
        created_at: serverTimestamp(),
        approved_at: serverTimestamp(),
      });

      toast.success(`User created! ID: ${employee_id}`);

      setShowCreateDialog(false);
      setNewUser({ email: "", password: "", name: "", role: "employee" });
      
      // Sign out the newly created user and let super admin re-authenticate
      await auth.signOut();
      
      // Note: Super admin will need to sign back in
      console.log("User created successfully. Super admin may need to re-login.");
      
      loadUsers();
    } catch (error: any) {
      console.error("User creation error:", error);
      
      let message = "User creation failed";
      if (error.code === "auth/email-already-in-use") {
        message = "This email is already registered.";
      } else if (error.code === "auth/invalid-email") {
        message = "Invalid email format.";
      } else if (error.code === "auth/weak-password") {
        message = "Password is too weak.";
      } else if (error.message) {
        message = error.message;
      }
      
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  // -----------------------------
  // DELETE USER
  // -----------------------------
  const handleDeleteUser = async (uid: string, email: string) => {
    if (!confirm(`Delete user ${email || uid}?`)) return;

    try {
      // Delete from all collections
      await Promise.all([
        deleteDoc(doc(fdb, "users", uid)).catch(() => {}),
        deleteDoc(doc(fdb, "user_profiles", uid)).catch(() => {}),
        deleteDoc(doc(fdb, "user_roles", uid)).catch(() => {}),
        deleteDoc(doc(fdb, "approval_requests", uid)).catch(() => {}),
      ]);

      toast.success(`User ${email || uid} removed from Firestore.`);
      loadUsers();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Delete failed. Auth user must be removed from Firebase Console.");
    }
  };

  // -----------------------------
  // UI
  // -----------------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">User Management</h3>

        <div className="flex gap-2">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" /> Create User
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="user@example.com"
                  />
                </div>

                <div>
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Min. 6 characters"
                  />
                </div>

                <div>
                  <Label>Role</Label>
                  <select
                    className="w-full p-2 border rounded-md bg-background"
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  >
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <Button 
                  onClick={handleCreateUser} 
                  className="w-full"
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create User"
                  )}
                </Button>
                
                <p className="text-xs text-muted-foreground">
                  Note: Creating a user will sign you out. You'll need to log back in.
                </p>
              </div>
            </DialogContent>
          </Dialog>

          <Button onClick={loadUsers} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      {/* TABLE */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Employee ID</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.name || "N/A"}</TableCell>
              <TableCell className="font-mono text-sm">{user.employee_id || "N/A"}</TableCell>
              <TableCell>{user.email || "N/A"}</TableCell>
              <TableCell>
                <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                  {user.role || "employee"}
                </Badge>
              </TableCell>
              <TableCell>
                {user.created_at?.toDate?.()?.toLocaleDateString() || "N/A"}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteUser(user.id, user.email || "")}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {users.length === 0 && (
        <p className="text-center text-muted-foreground mt-4">No users found. Create your first user above.</p>
      )}
    </div>
  );
}
