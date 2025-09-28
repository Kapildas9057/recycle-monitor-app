import type { User, WasteEntry, SummaryData, LeaderboardEntry, WasteType } from "@/types";

// Mock users for demo
export const mockUsers: User[] = [
  { id: "EMP001", name: "John Smith", email: "john@company.com", type: "employee" },
  { id: "EMP002", name: "Sarah Johnson", email: "sarah@company.com", type: "employee" },
  { id: "EMP003", name: "Mike Davis", email: "mike@company.com", type: "employee" },
  { id: "ADM001", name: "Admin User", email: "admin@company.com", type: "admin" },
];

// Mock waste types
export const wasteTypes: WasteType[] = [
  { id: 'plastic', name: 'Plastic', icon: '♻️', color: 'text-blue-500' },
  { id: 'paper', name: 'Paper', icon: '📄', color: 'text-orange-500' },
  { id: 'organic', name: 'Organic', icon: '🌱', color: 'text-green-500' },
  { id: 'metal', name: 'Metal', icon: '🔩', color: 'text-gray-500' },
  { id: 'glass', name: 'Glass', icon: '🫙', color: 'text-cyan-500' },
  { id: 'electronic', name: 'Electronic', icon: '💻', color: 'text-purple-500' },
];

// Generate mock waste entries
export const generateMockWasteEntries = (): WasteEntry[] => {
  const entries: WasteEntry[] = [];
  const employees = mockUsers.filter(u => u.type === 'employee');
  
  for (let i = 0; i < 50; i++) {
    const employee = employees[Math.floor(Math.random() * employees.length)];
    const wasteType = wasteTypes[Math.floor(Math.random() * wasteTypes.length)];
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    
    entries.push({
      id: `WE${String(i + 1).padStart(3, '0')}`,
      employeeId: employee.id,
      employeeName: employee.name,
      wasteType,
      amount: Math.round((Math.random() * 10 + 1) * 10) / 10, // 1-10 kg
      dateTime: date.toISOString(),
      status: Math.random() > 0.1 ? 'approved' : Math.random() > 0.5 ? 'pending' : 'rejected',
    });
  }
  
  return entries.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
};

export const calculateSummaryData = (entries: WasteEntry[]): SummaryData => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const approvedEntries = entries.filter(e => e.status === 'approved');

  return {
    today: approvedEntries
      .filter(e => new Date(e.dateTime) >= today)
      .reduce((sum, e) => sum + e.amount, 0),
    thisWeek: approvedEntries
      .filter(e => new Date(e.dateTime) >= weekAgo)
      .reduce((sum, e) => sum + e.amount, 0),
    thisMonth: approvedEntries
      .filter(e => new Date(e.dateTime) >= monthAgo)
      .reduce((sum, e) => sum + e.amount, 0),
    thisYear: approvedEntries
      .filter(e => new Date(e.dateTime) >= yearStart)
      .reduce((sum, e) => sum + e.amount, 0),
  };
};

export const calculateLeaderboard = (entries: WasteEntry[]): LeaderboardEntry[] => {
  const approvedEntries = entries.filter(e => e.status === 'approved');
  const employeeTotals = approvedEntries.reduce((acc, entry) => {
    if (!acc[entry.employeeId]) {
      acc[entry.employeeId] = {
        employeeId: entry.employeeId,
        employeeName: entry.employeeName,
        totalWaste: 0,
        rank: 0,
      };
    }
    acc[entry.employeeId].totalWaste += entry.amount;
    return acc;
  }, {} as Record<string, LeaderboardEntry>);

  return Object.values(employeeTotals)
    .sort((a, b) => b.totalWaste - a.totalWaste)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
};

// Mock authentication function
export const authenticateUser = async (id: string, password: string, userType: 'employee' | 'admin'): Promise<User | null> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock authentication logic
  if (userType === 'admin' && id === 'admin' && password === 'admin') {
    return mockUsers.find(u => u.type === 'admin') || null;
  }
  
  if (userType === 'employee' && password === 'password') {
    return mockUsers.find(u => u.id === id && u.type === 'employee') || null;
  }
  
  return null;
};