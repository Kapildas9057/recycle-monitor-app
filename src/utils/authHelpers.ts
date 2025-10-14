import { supabase } from "@/integrations/supabase/client";

/**
 * Generate next employee ID with proper prefix
 */
export async function generateEmployeeId(userType: 'employee' | 'admin'): Promise<string> {
  const prefix = userType === 'admin' ? 'ADM' : 'EMP';
  
  const { data, error } = await supabase.rpc('get_next_employee_id', { prefix });
  
  if (error) throw error;
  return data;
}

/**
 * Get email from employee ID for login
 */
export async function getEmailByEmployeeId(employeeId: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('get_email_by_employee_id', { emp_id: employeeId });
  
  if (error) throw error;
  return data;
}

/**
 * Validate employee ID format
 */
export function validateEmployeeId(employeeId: string): boolean {
  return /^(EMP|ADM)\d{3,}$/.test(employeeId);
}
