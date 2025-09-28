import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { WasteEntry } from "@/types";

interface GraphsTabProps {
  wasteEntries: WasteEntry[];
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function GraphsTab({ wasteEntries }: GraphsTabProps) {
  const [timePeriod, setTimePeriod] = useState("week");
  const [selectedEmployee, setSelectedEmployee] = useState("all");

  // Get unique employees
  const employees = Array.from(new Set(wasteEntries.map(entry => entry.employeeName)));

  // Filter entries based on selection
  const filteredEntries = selectedEmployee === "all" 
    ? wasteEntries 
    : wasteEntries.filter(entry => entry.employeeName === selectedEmployee);

  // Process data for charts
  const processDataByTime = (period: string) => {
    const now = new Date();
    const entries = filteredEntries.filter(entry => {
      const entryDate = new Date(entry.dateTime);
      const timeDiff = now.getTime() - entryDate.getTime();
      const daysDiff = timeDiff / (1000 * 3600 * 24);
      
      switch (period) {
        case "week": return daysDiff <= 7;
        case "month": return daysDiff <= 30;
        default: return true;
      }
    });

    const groupedData = entries.reduce((acc, entry) => {
      const date = new Date(entry.dateTime).toDateString();
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += entry.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(groupedData).map(([date, amount]) => ({
      date: new Date(date).toLocaleDateString(),
      amount: Number(amount.toFixed(1)),
    }));
  };

  const processDataByWasteType = () => {
    const wasteTypeData = filteredEntries.reduce((acc, entry) => {
      const type = entry.wasteType.name;
      if (!acc[type]) {
        acc[type] = 0;
      }
      acc[type] += entry.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(wasteTypeData).map(([name, value]) => ({
      name,
      value: Number(value.toFixed(1)),
    }));
  };

  const processDataByEmployee = () => {
    const employeeData = wasteEntries.reduce((acc, entry) => {
      const employee = entry.employeeName;
      if (!acc[employee]) {
        acc[employee] = 0;
      }
      acc[employee] += entry.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(employeeData)
      .map(([name, amount]) => ({
        name,
        amount: Number(amount.toFixed(1)),
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10); // Top 10 employees
  };

  const timeData = processDataByTime(timePeriod);
  const wasteTypeData = processDataByWasteType();
  const employeeData = processDataByEmployee();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-display font-semibold text-foreground">
            Analytics & Graphs
          </h2>
          <p className="text-muted-foreground">
            Visual representation of waste collection data
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Employees</SelectItem>
              {employees.map(employee => (
                <SelectItem key={employee} value={employee}>
                  {employee}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Collection Trend */}
        <Card className="shadow-card border-card-border">
          <CardHeader>
            <CardTitle>Collection Trend</CardTitle>
            <CardDescription>Daily waste collection over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Waste Type Distribution */}
        <Card className="shadow-card border-card-border">
          <CardHeader>
            <CardTitle>Waste Type Distribution</CardTitle>
            <CardDescription>Breakdown by waste category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={wasteTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {wasteTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Employees */}
        <Card className="shadow-card border-card-border lg:col-span-2">
          <CardHeader>
            <CardTitle>Employee Performance</CardTitle>
            <CardDescription>Top performing employees by waste collection</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={employeeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="amount" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}