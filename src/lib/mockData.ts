import type { User, WasteEntry, SummaryData, LeaderboardEntry, WasteType } from "@/types";

// Mock users for demo
export const mockUsers: User[] = [
  { id: "EMP001", name: "John Smith", employeeId: "EMP001", type: "employee" },
  { id: "EMP002", name: "Sarah Johnson", employeeId: "EMP002", type: "employee" },
  { id: "EMP003", name: "Mike Davis", employeeId: "EMP003", type: "employee" },
  { id: "EMP004", name: "Emily Wilson", employeeId: "EMP004", type: "employee" },
  { id: "EMP005", name: "David Brown", employeeId: "EMP005", type: "employee" },
  { id: "EMP006", name: "Lisa Garcia", employeeId: "EMP006", type: "employee" },
  { id: "EMP007", name: "James Miller", employeeId: "EMP007", type: "employee" },
  { id: "EMP008", name: "Maria Rodriguez", employeeId: "EMP008", type: "employee" },
  { id: "EMP009", name: "Robert Taylor", employeeId: "EMP009", type: "employee" },
  { id: "EMP010", name: "Jennifer Anderson", employeeId: "EMP010", type: "employee" },
  { id: "EMP011", name: "Michael Thomas", employeeId: "EMP011", type: "employee" },
  { id: "EMP012", name: "Amanda Jackson", employeeId: "EMP012", type: "employee" },
  { id: "EMP013", name: "Christopher White", employeeId: "EMP013", type: "employee" },
  { id: "EMP014", name: "Jessica Harris", employeeId: "EMP014", type: "employee" },
  { id: "EMP015", name: "Daniel Martin", employeeId: "EMP015", type: "employee" },
  { id: "EMP016", name: "Ashley Thompson", employeeId: "EMP016", type: "employee" },
  { id: "EMP017", name: "Matthew Garcia", employeeId: "EMP017", type: "employee" },
  { id: "EMP018", name: "Stephanie Lee", employeeId: "EMP018", type: "employee" },
  { id: "EMP019", name: "Andrew Clark", employeeId: "EMP019", type: "employee" },
  { id: "EMP020", name: "Nicole Lewis", employeeId: "EMP020", type: "employee" },
  { id: "ADM001", name: "Admin User", employeeId: "ADM001", type: "admin" },
];

// Mock waste types
export const wasteTypes: WasteType[] = [
  { id: 'wet', name: 'Wet', icon: '💧', color: 'text-green-500' },
  { id: 'dry', name: 'Dry', icon: '♻️', color: 'text-blue-500' },
  { id: 'sanitary', name: 'Sanitary', icon: '🧻', color: 'text-pink-500' },
  { id: 'mixed', name: 'Mixed', icon: '🗑️', color: 'text-gray-500' },
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
    
    const hasPhoto = Math.random() > 0.3; // 70% chance of having a photo
    const status = Math.random() > 0.1 ? 'approved' : Math.random() > 0.5 ? 'pending' : 'rejected';
    
    entries.push({
      id: `WE${String(i + 1).padStart(3, '0')}`,
      employeeId: employee.id,
      employeeName: employee.name,
      wasteType,
      amount: Math.round((Math.random() * 10 + 1) * 10) / 10, // 1-10 kg
      dateTime: date.toISOString(),
      imageUrl: hasPhoto ? `https://picsum.photos/800/600?random=${i}` : undefined,
      status,
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