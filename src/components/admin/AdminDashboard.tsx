import { useState } from "react";
import { BarChart3, Calendar, Users, Award, LogOut, ClipboardCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EcoButton } from "@/components/ui/eco-button";
import SummaryTab from "./SummaryTab";
import DataEntriesTab from "./DataEntriesTab";
import GraphsTab from "./GraphsTab";
import LeaderboardTab from "./LeaderboardTab";
import ReviewTab from "./ReviewTab";
import type { User, WasteEntry, SummaryData, LeaderboardEntry } from "@/types";

interface AdminDashboardProps {
  user: User;
  wasteEntries: WasteEntry[];
  summaryData: SummaryData;
  leaderboardData: LeaderboardEntry[];
  onLogout: () => void;
  onApproveEntry: (entryId: string) => void;
  onRejectEntry: (entryId: string, reason?: string) => void;
  onClearAllData: () => void;
}

export default function AdminDashboard({
  user,
  wasteEntries,
  summaryData,
  leaderboardData,
  onLogout,
  onApproveEntry,
  onRejectEntry,
  onClearAllData
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState("summary");

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/20">
      {/* Header */}
      <div className="bg-card border-b border-card-border shadow-card">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-semibold text-foreground">
                EcoShift Admin Dashboard
              </h1>
              <p className="text-muted-foreground">Welcome back, {user.name}</p>
            </div>
            <EcoButton variant="outline" onClick={onLogout}>
              <LogOut className="w-4 h-4" />
              Logout
            </EcoButton>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-card border border-card-border">
            <TabsTrigger value="summary" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Summary
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Data Entries
            </TabsTrigger>
            <TabsTrigger value="graphs" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Graphs
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              Leaderboard
            </TabsTrigger>
            <TabsTrigger value="review" className="flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4" />
              Review
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <SummaryTab summaryData={summaryData} wasteEntries={wasteEntries} />
          </TabsContent>

          <TabsContent value="data">
            <DataEntriesTab wasteEntries={wasteEntries} onClearAllData={onClearAllData} />
          </TabsContent>

          <TabsContent value="graphs">
            <GraphsTab wasteEntries={wasteEntries} />
          </TabsContent>

          <TabsContent value="leaderboard">
            <LeaderboardTab leaderboardData={leaderboardData} />
          </TabsContent>

          <TabsContent value="review">
            <ReviewTab 
              wasteEntries={wasteEntries} 
              onApprove={onApproveEntry}
              onReject={onRejectEntry}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}