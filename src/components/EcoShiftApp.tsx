import React, { useState, useEffect } from "react";
import LoginForm from "@/components/auth/LoginForm";
import WasteEntryForm from "@/components/employee/WasteEntryForm";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { getStoredEntries, saveEntry, updateEntryStatus, clearAllEntries } from "@/utils/storage";
import { 
  calculateSummaryData, 
  calculateLeaderboard
} from "@/lib/mockData";
import type { WasteEntry } from "@/types";
import { toast } from "@/components/ui/sonner";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";

interface AppUser {
  id: string;
  name: string;
  type: 'employee' | 'admin';
  employeeId?: string;
}

export default function EcoShiftApp() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [wasteEntries, setWasteEntries] = useState<WasteEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Set up auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            loadUserProfile(session.user.id);
          }, 0);
        } else {
          setCurrentUser(null);
          setIsLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load entries when user is authenticated
  useEffect(() => {
    if (currentUser) {
      loadEntries();
    }
  }, [currentUser]);

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('waste-entries-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'waste_entries'
        },
        () => {
          // Reload entries on any change
          loadEntries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile) throw new Error("Profile not found");

      // Get user role from user_roles table - may not exist for legacy users
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (roleError) throw roleError;

      // Default to 'employee' if no role found (legacy users)
      const userType = roleData?.role === 'admin' ? 'admin' : 'employee';

      setCurrentUser({
        id: userId,
        name: profile.name,
        type: userType,
        employeeId: profile.employee_id,
      });
    } catch (error) {
      toast.error('Failed to load user profile');
    } finally {
      setIsLoading(false);
    }
  };

  const loadEntries = async () => {
    try {
      const entries = await getStoredEntries();
      setWasteEntries(entries);
    } catch (error) {
      toast.error('Failed to load waste entries');
    }
  };

  const handleLogin = (user: SupabaseUser, role: string, employeeId: string, name: string) => {
    setCurrentUser({
      id: user.id,
      name,
      type: role as 'employee' | 'admin',
      employeeId,
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setUser(null);
    setSession(null);
  };

  const handleWasteSubmission = async (
    entryData: Omit<WasteEntry, 'id' | 'employeeName' | 'status'>,
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
    // Entries will be updated via realtime subscription
  };

  const handleApproveEntry = async (entryId: string) => {
    try {
      await updateEntryStatus(entryId, 'approved');
      // Entries will be updated via realtime subscription
    } catch (error) {
      toast.error('Failed to approve entry');
    }
  };

  const handleRejectEntry = async (entryId: string, reason?: string) => {
    try {
      await updateEntryStatus(entryId, 'rejected');
      // Entries will be updated via realtime subscription
    } catch (error) {
      toast.error('Failed to reject entry');
    }
  };

  const handleClearAllData = async () => {
    try {
      await clearAllEntries();
      // Entries will be updated via realtime subscription
    } catch (error) {
      toast.error('Failed to clear data');
    }
  };

  // Calculate derived data
  const summaryData = calculateSummaryData(wasteEntries);
  const leaderboardData = calculateLeaderboard(wasteEntries);

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

  if (currentUser.type === 'employee') {
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
                              entry.status === 'approved'
                                ? 'bg-success/20 text-success'
                                : entry.status === 'rejected'
                                ? 'bg-destructive/20 text-destructive'
                                : 'bg-warning/20 text-warning'
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
    <>
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
      
    </>
  );
}