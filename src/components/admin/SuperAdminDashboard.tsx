import React, { useState, useEffect } from "react";
import { Shield, Users, Trash2, Database, Settings, BarChart3, LogOut } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import type { WasteEntry } from "@/types";
import { db } from "@/integrations/firebase/client";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import SuperAdminUsersTab from "./SuperAdminUsersTab";
import SuperAdminDataTab from "./SuperAdminDataTab";
import SuperAdminAnalyticsTab from "./SuperAdminAnalyticsTab";
import SuperAdminStorageTab from "./SuperAdminStorageTab";
import SuperAdminSettingsTab from "./SuperAdminSettingsTab";

interface SuperAdminDashboardProps {
  user: {
    id: string;
    name: string;
    type: string;
  };
  wasteEntries: WasteEntry[];
  summaryData: any;
  leaderboardData: any[];
  onLogout: () => void;
  onApproveEntry: (id: string) => void;
  onRejectEntry: (id: string) => void;
  onClearAllData: () => void;
}

export default function SuperAdminDashboard({
  user,
  wasteEntries,
  summaryData,
  leaderboardData,
  onLogout,
  onApproveEntry,
  onRejectEntry,
  onClearAllData,
}: SuperAdminDashboardProps) {
  const [activeTab, setActiveTab] = useState("users");
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEmployees: 0,
    totalAdmins: 0,
    totalEntries: wasteEntries.length,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      const users = usersSnap.docs.map(d => d.data());
      
      setStats({
        totalUsers: users.length,
        totalEmployees: users.filter(u => u.role === "employee").length,
        totalAdmins: users.filter(u => u.role === "admin").length,
        totalEntries: wasteEntries.length,
      });
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary via-primary/90 to-accent border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-foreground/10 rounded-lg">
                <Shield className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary-foreground">Super Admin Portal</h1>
                <p className="text-sm text-primary-foreground/80">Full System Control</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-primary-foreground">{user.name}</p>
                <p className="text-xs text-primary-foreground/70">Super Administrator</p>
              </div>
              <Button variant="outline" size="sm" onClick={onLogout} className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-border bg-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalUsers}</p>
                </div>
                <Users className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Employees</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalEmployees}</p>
                </div>
                <Users className="w-8 h-8 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Admins</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalAdmins}</p>
                </div>
                <Shield className="w-8 h-8 text-secondary" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Waste Entries</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalEntries}</p>
                </div>
                <Database className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Card className="border-border bg-card">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <CardHeader className="border-b border-border">
              <TabsList className="grid w-full grid-cols-5 bg-muted">
                <TabsTrigger value="users" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Users className="w-4 h-4 mr-2" />
                  Users
                </TabsTrigger>
                <TabsTrigger value="data" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Database className="w-4 h-4 mr-2" />
                  Waste Data
                </TabsTrigger>
                <TabsTrigger value="analytics" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="storage" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Storage
                </TabsTrigger>
                <TabsTrigger value="settings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="p-6">
              <TabsContent value="users" className="mt-0">
                <SuperAdminUsersTab onRefresh={loadStats} />
              </TabsContent>

              <TabsContent value="data" className="mt-0">
                <SuperAdminDataTab
                  wasteEntries={wasteEntries}
                  onApprove={onApproveEntry}
                  onReject={onRejectEntry}
                  onClearAll={onClearAllData}
                />
              </TabsContent>

              <TabsContent value="analytics" className="mt-0">
                <SuperAdminAnalyticsTab
                  wasteEntries={wasteEntries}
                  summaryData={summaryData}
                  leaderboardData={leaderboardData}
                />
              </TabsContent>

              <TabsContent value="storage" className="mt-0">
                <SuperAdminStorageTab />
              </TabsContent>

              <TabsContent value="settings" className="mt-0">
                <SuperAdminSettingsTab user={user} />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
