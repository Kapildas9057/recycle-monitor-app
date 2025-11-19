export interface User {
  id: string;
  name: string;
  employee_id?: string;
  type: 'employee' | 'admin' | 'super_admin';
}

export interface WasteEntry {
  id: string;
  employee_id: string;
  employeeName: string;
  wasteType: string;
  amount: number;
  dateTime: string;
  created_at?: string;
  location?: string;
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
  employee_id: string;
  employeeName: string;
  totalWaste: number;
  rank: number;
}

export interface AuthCredentials {
  id: string;
  password: string;
  userType: 'employee' | 'admin';
}