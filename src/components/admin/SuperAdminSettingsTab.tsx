import React, { useState } from "react";
import { Download, Key, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { auth } from "@/integrations/firebase/client";
import { updateEmail, updatePassword, sendPasswordResetEmail } from "firebase/auth";

interface SuperAdminSettingsTabProps {
  user: {
    id: string;
    name: string;
  };
}

export default function SuperAdminSettingsTab({ user }: SuperAdminSettingsTabProps) {
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleUpdateEmail = async () => {
    if (!newEmail || !newEmail.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }

    try {
      if (auth.currentUser) {
        await updateEmail(auth.currentUser, newEmail);
        toast.success("Email updated successfully");
        setNewEmail("");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update email");
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        toast.success("Password updated successfully");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    }
  };

  const handleExportDatabase = () => {
    toast.info("Database export feature coming soon");
  };

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base">Update Email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-email">New Email Address</Label>
            <Input
              id="new-email"
              type="email"
              placeholder="new@email.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
          </div>
          <Button onClick={handleUpdateEmail} variant="default">
            <Mail className="w-4 h-4 mr-2" />
            Update Email
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base">Update Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <Button onClick={handleUpdatePassword} variant="default">
            <Key className="w-4 h-4 mr-2" />
            Update Password
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base">Database Export</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Export a complete snapshot of the database as CSV or Excel
          </p>
          <Button onClick={handleExportDatabase} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Database
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
