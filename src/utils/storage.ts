
import type { WasteEntry } from "@/types";

export interface DatabaseWasteEntry {
  id: string;
  employee_id: string;
  employee_name: string | null;
  waste_type: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
  amount: number;
  date_time: string;
  location: string | null;
  image_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

/**
 * Convert database format to app format
 */
function dbToWasteEntry(dbEntry: DatabaseWasteEntry): WasteEntry {
  return {
    id: dbEntry.id,
    employeeId: dbEntry.employee_id,
    employeeName: dbEntry.employee_name || "",
    wasteType: dbEntry.waste_type,
    amount: dbEntry.amount,
    dateTime: dbEntry.date_time,
    location: dbEntry.location || undefined,
    imageUrl: dbEntry.image_url || undefined,
    status: (dbEntry.status as 'pending' | 'approved' | 'rejected') || 'pending',
  };
}

/**
 * Fetch all waste entries from Supabase
 */
export async function getStoredEntries(): Promise<WasteEntry[]> {
  const { data, error } = await supabase
    .from('waste_entries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('Failed to load waste entries');
  }

  return (data as DatabaseWasteEntry[]).map(dbToWasteEntry);
}

/**
 * Upload image to Supabase Storage
 */
export async function uploadImage(file: File, employeeId: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${employeeId}-${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('waste-images')
    .upload(filePath, file);

  if (uploadError) {
    throw new Error('Failed to upload image');
  }

  // Get public URL
  const { data } = supabase.storage
    .from('waste-images')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

/**
 * Save a new waste entry to Supabase
 */
export async function saveEntry(
  entry: Omit<WasteEntry, 'id' | 'status'>,
  imageFile?: File
): Promise<WasteEntry> {
  let imageUrl = entry.imageUrl;

  // Upload image if provided
  if (imageFile) {
    imageUrl = await uploadImage(imageFile, entry.employeeId);
  }

  const { data, error } = await supabase
    .from('waste_entries')
    .insert([{
      employee_id: entry.employeeId,
      employee_name: entry.employeeName || null,
      waste_type: entry.wasteType as any,
      amount: entry.amount,
      date_time: entry.dateTime,
      location: entry.location || null,
      image_url: imageUrl || null,
      status: 'pending',
    }])
    .select()
    .single();

  if (error) {
    throw new Error('Failed to save waste entry');
  }

  return dbToWasteEntry(data as DatabaseWasteEntry);
}

/**
 * Update entry status (for admin approval/rejection)
 */
export async function updateEntryStatus(
  entryId: string,
  status: 'approved' | 'rejected'
): Promise<void> {
  const { error } = await supabase
    .from('waste_entries')
    .update({ status })
    .eq('id', entryId);

  if (error) {
    throw new Error('Failed to update entry status');
  }
}

/**
 * Delete all entries (admin only)
 */
export async function clearAllEntries(): Promise<void> {
  const { error } = await supabase
    .from('waste_entries')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

  if (error) {
    throw new Error('Failed to clear entries');
  }
}
