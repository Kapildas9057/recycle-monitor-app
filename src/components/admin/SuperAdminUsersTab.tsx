import React, { useState, useEffect } from "react";
import { UserPlus, Trash2, Edit, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { db, auth } from "@/integrations/firebase/client";
import { collection, getDocs, deleteDoc, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";

interface User {
  id: string;
  email: string;
  employee_id: string;
  role: string;
  created_at: any;
}

export default function SuperAdminUsersTab({ onRefresh }: { onRefresh: () => void }) {
  const [users, setUsers] = useState<User[]>([]);
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

  const loadUsers = async () => {
    setLoading(true);
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      const usersData = usersSnap.docs.map(d => ({ id: d.id, ...d.data() } as User));
      setUsers(usersData);
      onRefresh();
    } catch (error) {
      console.error("Failed to load users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const generateEmployeeId = (role: string) => {
    const prefix = role === "admin" ? "ADM" : "EMP";
    const randomNum = Math.floor(Math.random() * 900) + 100;
    return `${prefix}${randomNum}`;
  };

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.name) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      const employeeId = generateEmployeeId(newUser.role);
      
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newUser.email,
        newUser.password
      );

      // Store user data in Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email: newUser.email,
        employee_id: employeeId,
        role: newUser.role,
        created_at: serverTimestamp(),
      });

      await setDoc(doc(db, "user_profiles", userCredential.user.uid), {
        name: newUser.name,
        employee_id: employeeId,
        created_at: serverTimestamp(),
      });

      await setDoc(doc(db, "user_roles", userCredential.user.uid), {
        role: newUser.role,
        created_at: serverTimestamp(),
      });

      toast.success(`User created successfully with ID: ${employeeId}`);
      setShowCreateDialog(false);
      setNewUser({ email: "", password: "", name: "", role: "employee" });
      loadUsers();
    } catch (error: any) {
      console.error("Failed to create user:", error);
      toast.error(error.message || "Failed to create user");
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to delete user ${email}?`)) return;

    try {
      await deleteDoc(doc(db, "users", userId));
      await deleteDoc(doc(db, "user_profiles", userId));
      await deleteDoc(doc(db, "user_roles", userId));

      toast.success("User deleted successfully");
      loadUsers();
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast.error("Failed to delete user. Note: Firebase Auth user must be deleted manually from Firebase Console.");
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">User Management</h3>
        <div className="flex gap-2">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button variant="default">
                <UserPlus className="w-4 h-4 mr-2" />
                Create User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="Enter full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="user@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Min. 6 characters"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreateUser} className="w-full">
                  Create User
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button onClick={loadUsers} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
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
                <TableCell className="font-mono text-sm">{user.employee_id}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                    {user.role === "admin" ? "🛠️ Admin" : "🧑‍💼 Employee"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {user.created_at?.toDate?.()?.toLocaleDateString() || "N/A"}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteUser(user.id, user.email)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {users.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No users found</p>
        </div>
      )}
    </div>
  );
}
