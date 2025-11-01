import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WasteEntry } from "@/types";

interface SuperAdminAnalyticsTabProps {
  wasteEntries: WasteEntry[];
  summaryData: any;
  leaderboardData: any[];
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--secondary))", "hsl(var(--muted))"];

export default function SuperAdminAnalyticsTab({
  wasteEntries,
  summaryData,
  leaderboardData,
}: SuperAdminAnalyticsTabProps) {
  const wasteTypeData = wasteEntries.reduce((acc: any, entry) => {
    const type = entry.wasteType?.toString() || "Unknown";
    acc[type] = (acc[type] || 0) + (entry.amount || 0);
    return acc;
  }, {});

  const chartData = Object.entries(wasteTypeData).map(([name, value]) => ({
    name,
    value: Number(value),
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total Waste Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{summaryData?.totalWaste || 0} kg</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Active Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{leaderboardData?.length || 0}</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{wasteEntries.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Waste Distribution by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Top Performers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {leaderboardData?.slice(0, 5).map((leader, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{leader.employeeName || "Unknown"}</p>
                    <p className="text-sm text-muted-foreground">{leader.employeeId}</p>
                  </div>
                </div>
                <p className="text-lg font-semibold text-foreground">{leader.totalWaste} kg</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
