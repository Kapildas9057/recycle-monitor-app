import React, { useState, useEffect, useRef } from "react";
import LoginForm from "@/components/auth/LoginForm";
import WasteEntryForm from "@/components/employee/WasteEntryForm";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getStoredEntries, saveEntry, updateEntryStatus, clearAllEntries } from "@/utils/storage";
import { calculateSummaryData, calculateLeaderboard } from "@/lib/mockData";
import type { WasteEntry } from "@/types";
import { toast } from "@/components/ui/sonner";

import { auth, db } from "@/integrations/firebase/client";
import {
  onAuthStateChanged,
  signOut,
  User as FirebaseUser,
} from "firebase/auth";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
  onSnapshot,
  Query,
  DocumentData,
} from "firebase/firestore";

interface AppUser {
  id: string;
  name: string;
  type: "employee" | "admin";
  employeeId?: string;
}

export default function EcoShiftApp() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [wasteEntries, setWasteEntries] = useState<WasteEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Keep ref to unsubscribe function for realtime listener
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Auth state listener
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // load user profile from Firestore
        await loadUserProfile(firebaseUser.uid);
      } else {
        // signed out
        setCurrentUser(null);
        // cleanup entries listener
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
        setWasteEntries([]);
        setIsLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When currentUser changes, load entries & set up realtime subscription
  useEffect(() => {
    if (!currentUser) return;

    // load initial entries
    loadEntries();

    // unsubscribe previous listener if exists
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    // Build query depending on role
    const logsCol1 = collection(db, "wasteLogs");
    const logsCol2 = collection(db, "waste_entries"); // fallback name if used elsewhere

    let q: Query<DocumentData>;
    if (currentUser.type === "employee") {
      q = query(logsCol1, where("employeeId", "==", currentUser.employeeId || currentUser.id), orderBy("createdAt", "desc"));
    } else {
      q = query(logsCol1, orderBy("createdAt", "desc"));
    }

    // Use onSnapshot for realtime updates (first try wasteLogs collection)
    try {
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map((d) => transformDocToWasteEntry(d.id, d.data()));
        setWasteEntries(docs);
      }, async (err) => {
        // If error (e.g. collection doesn't exist), fallback to reading alternate collection or local storage
        console.warn("Realtime snapshot error (wasteLogs):", err);
        // try alternate collection
        try {
          let altQuery: Query<DocumentData>;
          if (currentUser.type === "employee") {
            altQuery = query(logsCol2, where("employeeId", "==", currentUser.employeeId || currentUser.id), orderBy("createdAt", "desc"));
          } else {
            altQuery = query(logsCol2, orderBy("createdAt", "desc"));
          }
          const unsubscribeAlt = onSnapshot(altQuery, (snapAlt) => {
            const docsAlt = snapAlt.docs.map((d) => transformDocToWasteEntry(d.id, d.data()));
            setWasteEntries(docsAlt);
          }, (err2) => {
            console.warn("Realtime snapshot error (waste_entries):", err2);
          });
          // replace ref
          unsubscribeRef.current = unsubscribeAlt;
        } catch (e) {
          console.warn("Realtime fallback failed, will use local storage fallback.");
          // leave as is; loadEntries will fallback to local storage
        }
      });

      unsubscribeRef.current = unsubscribe;
    } catch (e) {
      console.warn("Could not set realtime listener (wasteLogs). Falling back to periodic fetch.", e);
      // fallback: periodic poll or single load (we already called loadEntries)
    }

    // cleanup on role change/unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, currentUser?.employeeId, currentUser?.type]);

  // Helper: transform Firestore doc into WasteEntry (best-effort mapping)
  function transformDocToWasteEntry(id: string, data: any): WasteEntry {
    // Attempt to map commonly used field names; adapt if your schema differs.
    const dateTime = data.date || data.createdAt || data.dateTime;
    const dateIso = dateTime && typeof dateTime.toDate === "function"
      ? dateTime.toDate().toISOString()
      : (typeof dateTime === "string" ? dateTime : new Date().toISOString());

    const wasteType = typeof data.wasteType === "string"
      ? { name: data.wasteType, icon: data.wasteType } // minimal mapping — adjust if you store object
      : data.wasteType || { name: "Unknown", icon: "🗑️" };

    return {
      id,
      employeeId: data.employeeId || data.employee_id || data.empId || "",
      employeeName: data.employeeName || data.employee_name || data.name || "",
      wasteType,
      amount: data.amount ?? data.weight ?? 0,
      unit: data.unit || "kg",
      location: data.location || "",
      dateTime: dateIso,
      status: data.status || "pending",
      imageUrl: data.imageUrl || data.image || null,
      notes: data.notes || data.note || "",
    } as WasteEntry;
  }

  // Load user profile from Firestore 'users' or 'user_profiles'
  const loadUserProfile = async (uid: string) => {
    setIsLoading(true);
    try {
      // Try 'users' doc by uid
      const userDocRef = doc(db, "users", uid);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        const u = userSnap.data() as any;
        const role = u.role === "admin" ? "admin" : "employee";
        setCurrentUser({
          id: uid,
          name: u.name || u.displayName || u.email || "Unknown",
          type: role,
          employeeId: u.employeeId || u.employee_id || u.employeeId || undefined,
        });
        setIsLoading(false);
        return;
      }

      // Fallback: look up user_profiles by user_id field
      const profilesCol = collection(db, "user_profiles");
      const q = query(profilesCol, where("user_id", "==", uid));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const profile = snap.docs[0].data() as any;
        // try to read role from user_roles collection
        const rolesRef = collection(db, "user_roles");
        const roleQ = query(rolesRef, where("user_id", "==", uid));
        const roleSnap = await getDocs(roleQ);
        const roleDoc = roleSnap.docs[0]?.data() as any;
        const roleStr = roleDoc?.role === "admin" ? "admin" : "employee";

        setCurrentUser({
          id: uid,
          name: profile.name || "Unknown",
          type: roleStr,
          employeeId: profile.employee_id || undefined,
        });
        setIsLoading(false);
        return;
      }

      // If still not found, set a minimal user and continue
      setCurrentUser({
        id: uid,
        name: "Unknown",
        type: "employee",
      });
    } catch (err) {
      console.error("Failed to load user profile:", err);
      toast.error("Failed to load user profile");
    } finally {
      setIsLoading(false);
    }
  };

  // Load entries: try Firestore, then fallback to local stored entries
  const loadEntries = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      // Try primary collection 'wasteLogs'
      const logsCol = collection(db, "wasteLogs");
      let q;
      if (currentUser.type === "employee") {
        q = query(logsCol, where("employeeId", "==", currentUser.employeeId || currentUser.id), orderBy("createdAt", "desc"));
      } else {
        q = query(logsCol, orderBy("createdAt", "desc"));
      }

      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docs = snapshot.docs.map((d) => transformDocToWasteEntry(d.id, d.data()));
        setWasteEntries(docs);
        setIsLoading(false);
        return;
      }

      // Fallback via alternate collection name 'waste_entries'
      const altCol = collection(db, "waste_entries");
      if (currentUser.type === "employee") {
        q = query(altCol, where("employeeId", "==", currentUser.employeeId || currentUser.id), orderBy("createdAt", "desc"));
      } else {
        q = query(altCol, orderBy("createdAt", "desc"));
      }
      const altSnap = await getDocs(q);
      if (!altSnap.empty) {
        const docsAlt = altSnap.docs.map((d) => transformDocToWasteEntry(d.id, d.data()));
        setWasteEntries(docsAlt);
        setIsLoading(false);
        return;
      }

      // Final fallback: local storage helper
      const local = await getStoredEntries();
      setWasteEntries(local);
    } catch (err) {
      console.error("Failed to load entries:", err);
      toast.error("Failed to load waste entries");
      // fallback to local stored entries
      try {
        const local = await getStoredEntries();
        setWasteEntries(local);
      } catch {}
    } finally {
      setIsLoading(false);
    }
  };

  // Login handler (called from LoginForm)
  const handleLogin = (user: FirebaseUser, role: string, employeeId: string, name: string) => {
    setCurrentUser({
      id: user.uid,
      name,
      type: role as "employee" | "admin",
      employeeId,
    });
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn("Sign out failed:", err);
    }
    setCurrentUser(null);
    setUser(null);
    setWasteEntries([]);
  };

  const handleWasteSubmission = async (
    entryData: Omit<WasteEntry, "id" | "employeeName" | "status">,
    imageFile?: File
  ) => {
    if (!currentUser) throw new Error("User not authenticated");

    await saveEntry(
      {
        ...entryData,
        employeeName: currentUser.name,
        employeeId: currentUser.employeeId || entryData.employeeId,
      },
      imageFile
    );
    // Firestore realtime listener will pick up the new item if saved server-side.
  };

  const handleApproveEntry = async (entryId: string) => {
    try {
      // Try to update in Firestore if exists
      try {
        const entryRef = doc(db, "wasteLogs", entryId);
        await getDoc(entryRef); // check existence
        await (await import("firebase/firestore")).updateDoc(entryRef, { status: "approved" });
      } catch {
        // fallback to helper (local or other backend)
        await updateEntryStatus(entryId, "approved");
      }
    } catch (error) {
      toast.error("Failed to approve entry");
    }
  };

  const handleRejectEntry = async (entryId: string, reason?: string) => {
    try {
      try {
        const entryRef = doc(db, "wasteLogs", entryId);
        await getDoc(entryRef);
        await (await import("firebase/firestore")).updateDoc(entryRef, { status: "rejected", rejectReason: reason || null });
      } catch {
        await updateEntryStatus(entryId, "rejected");
      }
    } catch (error) {
      toast.error("Failed to reject entry");
    }
  };

  const handleClearAllData = async () => {
    try {
      // attempt to clear via helper (which might delete from Firestore or local)
      await clearAllEntries();
    } catch (error) {
      toast.error("Failed to clear data");
    }
  };

  // Derived values
  const summaryData = calculateSummaryData(wasteEntries);
  const leaderboardData = calculateLeaderboard(wasteEntries);

  // UI
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/20 flex items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginForm onLogin={handleLogin} />;
  }

  if (currentUser.type === "employee") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/20">
        <div className="relative">
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm bg-card border border-card-border rounded-lg text-foreground hover:bg-accent transition-colors"
            >
              Logout
            </button>
          </div>
          <WasteEntryForm
            employeeId={currentUser.employeeId || currentUser.id}
            onSubmit={handleWasteSubmission}
          />
        </div>

        {/* Display submitted entries */}
        <div className="max-w-4xl mx-auto px-4 pb-8">
          <Card className="shadow-eco border-card-border">
            <CardHeader>
              <CardTitle className="text-xl font-display">Recent Submissions / சமீபத்திய சமர்ப்பிப்புகள்</CardTitle>
            </CardHeader>
            <CardContent>
              {wasteEntries.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No entries yet / இன்னும் பதிவுகள் இல்லை
                </p>
              ) : (
                <div className="space-y-3">
                  {wasteEntries.slice(0, 10).map((entry) => (
                    <div
                      key={entry.id}
                      className="p-4 border border-card-border rounded-lg bg-card/50 hover:bg-card transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{entry.wasteType.icon}</span>
                            <span className="font-medium">{entry.wasteType.name}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <span className="font-semibold">{entry.amount} kg</span>
                            {entry.location && ` • ${entry.location}`}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(entry.dateTime).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              entry.status === "approved"
                                ? "bg-success/20 text-success"
                                : entry.status === "rejected"
                                ? "bg-destructive/20 text-destructive"
                                : "bg-warning/20 text-warning"
                            }`}
                          >
                            {entry.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
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
