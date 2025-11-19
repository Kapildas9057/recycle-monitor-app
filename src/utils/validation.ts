import { z } from 'zod';

// User signup validation schema
export const signupSchema = z.object({
  email: z.string().email('Invalid email address').max(255, 'Email too long'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  name: z.string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  employee_id: z.string()
    .trim()
    .min(3, 'Employee ID must be at least 3 characters')
    .max(20, 'Employee ID too long')
    .regex(/^[A-Z0-9]+$/, 'Employee ID must contain only uppercase letters and numbers'),
});

// Waste entry validation schema
export const wasteEntrySchema = z.object({
  wasteType: z.object({
    id: z.string(),
    name: z.string(),
    icon: z.string(),
    color: z.string(),
  }),
  amount: z.number()
    .positive('Amount must be positive')
    .max(10000, 'Amount exceeds maximum allowed (10000 kg)'),
  location: z.string().max(200, 'Location too long').optional(),
  employeeName: z.string()
    .trim()
    .min(1, 'Employee name required')
    .max(100, 'Employee name too long'),
  employee_id: z.string()
    .trim()
    .min(1, 'Employee ID required')
    .max(20, 'Employee ID too long'),
});

// Export types
export type SignupInput = z.infer<typeof signupSchema>;
export type WasteEntryInput = z.infer<typeof wasteEntrySchema>;
