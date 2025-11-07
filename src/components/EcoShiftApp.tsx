// src/components/EcoShiftApp.tsx
import React, { useState, useEffect, lazy, Suspense } from "react";
import LoginForm from "@/components/auth/LoginForm";
import WasteEntryForm from "@/components/employee/WasteEntryForm";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/integrations/firebase/client";
import { getStoredEntries, saveEntry, updateEntryStatus, clearAllEntries } from "@/utils/storage";
import { calculateSummaryData, calculateLeaderboard } from "@/lib/mockData";
import type { WasteEntry } from "@/types";
import { toast } from "@/hooks/use-toast";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  orderBy
} from "firebase/firestore";

const fdb = getFirestore();
const SuperAdminDashboard = lazy(() => import("@/components/admin/SuperAdminDashboard"));

const SUPER_ADMIN_EMAIL = "kd850539@gmail.com";

interface AppUser {
  id: string;
  name: string;
  type: 'employee' | 'admin' | 'super_admin';
  employeeId?: string;
}

export default function EcoShiftApp() {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [wasteEntries, setWasteEntries] = useState<WasteEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Auth listener (Firebase)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Super Admin override based on email
        if (user.email && user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
          setCurrentUser({
            id: user.uid,
            name: user.displayName || user.email || "Super Admin",
            type: 'super_admin',
          });
          setIsLoading(false);
          return;
        }

        // load Firestore user doc
        try {
          const userDoc = await getDocs(query(collection(fdb, "users"), where("uid", "==", user.uid)));
          if (!userDoc.empty) {
            const ud = userDoc.docs[0].data();
            setCurrentUser({
              id: user.uid,
              name: ud.name || ud.email || "No name",
              type: ud.role === "admin" ? "admin" : "employee",
              employeeId: ud.employee_id
            });
          } else {
            // fallback: try user_profiles
            const profileSnap = await getDocs(query(collection(fdb, "user_profiles"), where("user_id", "==", user.uid)));
            const profile = profileSnap.empty ? null : profileSnap.docs[0].data();
            setCurrentUser({
              id: user.uid,
              name: profile?.name || user.email || "Unknown",
              type: "employee",
              employeeId: profile?.employee_id
            });
          }
        } catch (err) {
          toast.error("Failed to load profile");
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setIsLoading(false);
    });

    return () => unsub();
  }, []);

  // Listen to waste_entries collection real-time using onSnapshot
  useEffect(() => {
    if (!currentUser) return;

    // Scope: admin & super admin see all; employee sees only own entries
    let q;
    if (currentUser.type === "admin" || currentUser.type === 'super_admin') {
      q = query(collection(fdb, "waste_entries"), orderBy("created_at", "desc"));
    } else {
      // For employees, only query if employeeId exists
      const eid = (currentUser.employeeId || "").trim();
      if (!eid) {
        console.warn("Employee has no employeeId, skipping waste entries listener");
        setWasteEntries([]);
        return;
      }
      q = query(
        collection(fdb, "waste_entries"),
        where("employee_id", "==", eid),
        orderBy("created_at", "desc")
      );
    }

    const unsub = onSnapshot(q, (snapshot) => {
      const items: WasteEntry[] = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      setWasteEntries(items);
    }, (err) => {
      console.error("Realtime listener error", err);
      toast.error("Failed to listen for updates.");
    });

    return () => unsub();
  }, [currentUser]);

  const handleLogin = (user: any, role: string, employeeId: string, name: string) => {
    setCurrentUser({
      id: user.uid,
      name,
      type: role as 'employee'|'admin'|'super_admin',
      employeeId
    });
  };

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentUser(null);
  };

  const handleWasteSubmission = async (entryData: Omit<WasteEntry, 'id' | 'employeeName' | 'status' | 'created_at'>, imageFile?: File) => {
    if (!currentUser) throw new Error("User not authenticated");
    await saveEntry({
      ...entryData,
      employeeName: currentUser.name,
      employeeId: currentUser.employeeId || entryData.employeeId,
      status: 'pending' as const
    }, imageFile);
  };

  const handleApproveEntry = async (entryId: string) => {
    try {
      await updateEntryStatus(entryId, 'approved');
    } catch {
      toast.error('Failed to approve entry');
    }
  };

  const handleRejectEntry = async (entryId: string) => {
    try {
      await updateEntryStatus(entryId, 'rejected');
    } catch {
      toast.error('Failed to reject entry');
    }
  };

  const handleClearAllData = async () => {
    try {
      await clearAllEntries();
    } catch {
      toast.error('Failed to clear data');
    }
  };

  const summaryData = calculateSummaryData(wasteEntries);
  const leaderboardData = calculateLeaderboard(wasteEntries);

  if (isLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><p>Loading...</p></div>;
  if (!currentUser) return <LoginForm onLogin={handleLogin} />;

  // 🔐 Super Admin Dashboard
  if (currentUser.type === 'super_admin') {
    return (
      <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><p>Loading Super Admin...</p></div>}>
        <SuperAdminDashboard
          user={currentUser}
          wasteEntries={wasteEntries}
          summaryData={summaryData}
          leaderboardData={leaderboardData}
          onLogout={handleLogout}
          onApproveEntry={handleApproveEntry}
          onRejectEntry={handleRejectEntry}
          onClearAllData={handleClearAllData}
        />
      </Suspense>
    );
  }

  if (currentUser.type === 'employee') {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="absolute top-4 right-4">
          <button onClick={handleLogout} className="px-4 py-2 bg-destructive text-destructive-foreground rounded">Logout</button>
        </div>
        <WasteEntryForm employeeId={currentUser.employeeId || currentUser.id} onSubmit={handleWasteSubmission} />
      </div>
    );
  }

  return (
    <AdminDashboard
      user={currentUser}
      wasteEntries={wasteEntries}
      summaryData={summaryData}
      leaderboardData={leaderboardData}
      onLogout={handleLogout}
      onApproveEntry={handleApproveEntry}
      onRejectEntry={handleRejectEntry}
      onClearAllData={handleClearAllData}
    />
  );
}
