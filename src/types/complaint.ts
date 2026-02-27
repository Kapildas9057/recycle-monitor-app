import { z } from 'zod';

export const complaintTypes = [
  { value: 'waste_not_collected', label: 'Waste Not Collected' },
  { value: 'late_collection', label: 'Late Collection' },
  { value: 'mixed_waste_issue', label: 'Mixed Waste Issue' },
  { value: 'staff_behavior', label: 'Staff Behavior' },
  { value: 'wrong_location', label: 'Wrong Location' },
  { value: 'other', label: 'Other' },
] as const;

export const complaintSchema = z.object({
  fullName: z.string().trim().min(2, 'Name is required').max(100),
  phone: z.string().trim().min(10, 'Valid phone number required').max(15),
  address: z.string().trim().min(5, 'Address is required').max(300),
  zone: z.string().trim().min(1, 'Zone is required').max(50),
  wardNumber: z.string().trim().min(1, 'Ward number is required').max(10),
  complaintType: z.string().min(1, 'Select a complaint type'),
  description: z.string().trim().min(10, 'Describe the issue (min 10 chars)').max(1000),
});

export type ComplaintInput = z.infer<typeof complaintSchema>;

export interface Complaint extends ComplaintInput {
  id: string;
  imageUrl: string | null;
  status: 'open' | 'investigating' | 'resolved';
  assignedEmployeeId: string | null;
  createdAt: any;
  resolvedAt: any;
  issueDate: any;
}
