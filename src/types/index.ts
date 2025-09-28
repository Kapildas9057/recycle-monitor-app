export interface User {
  id: string;
  name: string;
  email: string;
  type: 'employee' | 'admin';
}

export interface WasteEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  wasteType: WasteType;
  amount: number;
  dateTime: string;
  imageUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface WasteType {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface SummaryData {
  today: number;
  thisWeek: number;
  thisMonth: number;
  thisYear: number;
}

export interface LeaderboardEntry {
  employeeId: string;
  employeeName: string;
  totalWaste: number;
  rank: number;
}

export interface AuthCredentials {
  id: string;
  password: string;
  userType: 'employee' | 'admin';
}