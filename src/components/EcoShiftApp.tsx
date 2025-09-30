import React, { useState, useEffect } from "react";
import LoginForm from "@/components/auth/LoginForm";
import WasteEntryForm from "@/components/employee/WasteEntryForm";
import AdminDashboard from "@/components/admin/AdminDashboard";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import { 
  generateMockWasteEntries, 
  calculateSummaryData, 
  calculateLeaderboard, 
  authenticateUser,
  mockUsers
} from "@/lib/mockData";
import type { User, WasteEntry, AuthCredentials } from "@/types";

export default function EcoShiftApp() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [wasteEntries, setWasteEntries] = useState<WasteEntry[]>([]);

  useEffect(() => {
    // Initialize with mock data
    setWasteEntries(generateMockWasteEntries());
  }, []);

  const handleLogin = async (credentials: AuthCredentials) => {
    const user = await authenticateUser(credentials.id, credentials.password, credentials.userType);
    if (user) {
      setCurrentUser(user);
    } else {
      throw new Error("Invalid credentials");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleWasteSubmission = async (entryData: Omit<WasteEntry, 'id' | 'employeeName' | 'status'>) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const employee = mockUsers.find(u => u.id === entryData.employeeId);
    if (!employee) throw new Error("Employee not found");

    const newEntry: WasteEntry = {
      ...entryData,
      id: `WE${Date.now()}`,
      employeeName: employee.name,
      status: 'pending',
    };

    setWasteEntries(prev => [newEntry, ...prev]);
  };

  const handleApproveEntry = (entryId: string) => {
    setWasteEntries(prev => 
      prev.map(entry => 
        entry.id === entryId 
          ? { ...entry, status: 'approved' as const }
          : entry
      )
    );
  };

  const handleRejectEntry = (entryId: string, reason?: string) => {
    setWasteEntries(prev => 
      prev.map(entry => 
        entry.id === entryId 
          ? { ...entry, status: 'rejected' as const }
          : entry
      )
    );
  };

  // Calculate derived data
  const summaryData = calculateSummaryData(wasteEntries);
  const leaderboardData = calculateLeaderboard(wasteEntries);

  if (!currentUser) {
    return <LoginForm onLogin={handleLogin} />;
  }

  if (currentUser.type === 'employee') {
    return (
      <>
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
            employeeId={currentUser.id} 
            onSubmit={handleWasteSubmission} 
          />
        </div>
        <PWAInstallPrompt />
      </>
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
      />
      <PWAInstallPrompt />
    </>
  );
}