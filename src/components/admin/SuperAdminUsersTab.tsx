import React, { useState, useEffect } from "react";
import { UserPlus, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { getFirestore, collection, getDocs, deleteDoc, doc, setDoc, serverTimestamp } from "firebase/firestore";

const fdb = getFirestore();

export default function SuperAdminUsersTab({ onRefresh }: { onRefresh: () => void }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

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
  // LOAD USERS
  // -----------------------------
  const loadUsers = async () => {
    setLoading(true);
    try {
      const usersSnap = await getDocs(collection(fdb, "users"));
      const data = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUsers(data);

      onRefresh();
    } catch (error) {
      console.error("Failed to load users:", error);
      toast({
        title: "Error loading users",
        description: "Insufficient permissions or missing data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // EMPLOYEE ID GENERATOR
  // -----------------------------
  const generateEmployeeId = (role: string) => {
    const prefix = role === "admin" ? "ADM" : "EMP";
    const randomNum = Math.floor(Math.random() * 900) + 100;
    return `${prefix}${randomNum}`;
  };

  // -----------------------------------------------------
  // FIXED USER CREATION (NO LOGOUT) — USING REST API
  // -----------------------------------------------------
  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.name) {
      toast({
        title: "Missing fields",
        description: "Please fill all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const employee_id = generateEmployeeId(newUser.role);

      // 1️⃣ — GET SUPER ADMIN ID TOKEN
      const idToken = await window.firebaseAuth.currentUser.getIdToken(true);

      // 2️⃣ — CALL SECURE CLOUD FUNCTION TO CREATE AUTH USER
      const res = await fetch(
        "https://us-central1-ecoshift-007.cloudfunctions.net/createUserCustom",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            email: newUser.email,
            password: newUser.password,
          }),
        }
      );

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "User creation failed");

      const uid = result.uid;

      // 3️⃣ — SAVE USER PROFILE IN FIRESTORE
      await setDoc(doc(fdb, "users", uid), {
        email: newUser.email,
        employee_id,
        role: newUser.role,
        created_at: serverTimestamp(),
      });

      await setDoc(doc(fdb, "user_profiles", uid), {
        name: newUser.name,
        employee_id,
        created_at: serverTimestamp(),
      });

      await setDoc(doc(fdb, "user_roles", uid), {
        role: newUser.role,
        created_at: serverTimestamp(),
      });

      toast({
        title: "User created",
        description: `Employee ID: ${employee_id}`,
      });

      setShowCreateDialog(false);
      setNewUser({ email: "", password: "", name: "", role: "employee" });
      loadUsers();
    } catch (error: any) {
      console.error("User creation error:", error);
      toast({
        title: "User creation failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // -----------------------------
  // DELETE USER
  // -----------------------------
  const handleDeleteUser = async (uid: string, email: string) => {
    if (!confirm(`Delete user ${email}?`)) return;

    try {
      await deleteDoc(doc(fdb, "users", uid));
      await deleteDoc(doc(fdb, "user_profiles", uid));
      await deleteDoc(doc(fdb, "user_roles", uid));

      toast({
        title: "User deleted",
        description: `${email} removed.`,
      });

      loadUsers();
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Delete failed",
        description: "Auth user must be deleted manually from Firebase Console.",
        variant: "destructive",
      });
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
                  <Input
                    list="roles"
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  />
                  <datalist id="roles">
                    <option value="employee" />
                    <option value="admin" />
                  </datalist>
                </div>

                <Button onClick={handleCreateUser} className="w-full">
                  Create User
                </Button>
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
            <TableHead>Employee ID</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {users.map((user: any) => (
            <TableRow key={user.id}>
              <TableCell>{user.employee_id}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                  {user.role}
                </Badge>
              </TableCell>
              <TableCell>
                {user.created_at?.toDate?.()?.toLocaleDateString() || "N/A"}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  onClick={() => handleDeleteUser(user.id, user.email)}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {users.length === 0 && (
        <p className="text-center text-muted-foreground mt-4">No users found</p>
      )}
    </div>
  );
}
