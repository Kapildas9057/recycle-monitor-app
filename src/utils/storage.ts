// src/utils/storage.ts
import { getFirestore, collection, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDocs, query, orderBy } from "firebase/firestore";
import type { WasteEntry } from "@/types";

const fdb = getFirestore();

/**
 * Save a waste entry to Firestore
 * Ensures all required fields are present before saving
 */
export async function saveEntry(
  entry: Omit<WasteEntry, "id" | "created_at">, 
  imageFile?: File
): Promise<string> {
  // Validate required fields
  if (!entry.employee_id) {
    throw new Error("employee_id is required");
  }
  if (!entry.wasteType) {
    throw new Error("wasteType is required");
  }
  if (entry.amount === undefined || entry.amount === null) {
    throw new Error("amount is required");
  }

  // Prepare the document with all fields
  const docData = {
    employee_id: entry.employee_id,
    employeeName: entry.employeeName || "Unknown",
    wasteType: entry.wasteType,
    amount: Number(entry.amount) || 0,
    dateTime: entry.dateTime || new Date().toISOString(),
    location: entry.location || null,
    status: entry.status || "pending",
    imageUrl: entry.imageUrl || null,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  };

  console.log("[saveEntry] Saving waste entry:", docData);

  try {
    const docRef = await addDoc(collection(fdb, "waste_entries"), docData);
    console.log("[saveEntry] Entry saved with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("[saveEntry] Failed to save entry:", error);
    throw error;
  }
}

/**
 * Update the status of a waste entry
 */
export async function updateEntryStatus(
  entryId: string, 
  status: "approved" | "rejected" | "pending"
): Promise<void> {
  if (!entryId) {
    throw new Error("entryId is required");
  }
  
  console.log("[updateEntryStatus] Updating entry:", entryId, "to status:", status);
  
  const ref = doc(fdb, "waste_entries", entryId);
  await updateDoc(ref, { 
    status,
    updated_at: serverTimestamp()
  });
  
  console.log("[updateEntryStatus] Status updated successfully");
}

/**
 * Delete all waste entries
 */
export async function clearAllEntries(): Promise<number> {
  console.log("[clearAllEntries] Clearing all entries...");
  
  const snap = await getDocs(collection(fdb, "waste_entries"));
  const count = snap.docs.length;
  
  if (count === 0) {
    console.log("[clearAllEntries] No entries to clear");
    return 0;
  }
  
  const promises = snap.docs.map(d => deleteDoc(doc(fdb, "waste_entries", d.id)));
  await Promise.all(promises);
  
  console.log("[clearAllEntries] Cleared", count, "entries");
  return count;
}

/**
 * Get all stored waste entries, ordered by created_at descending
 */
export async function getStoredEntries(): Promise<WasteEntry[]> {
  console.log("[getStoredEntries] Fetching all entries...");
  
  try {
    const q = query(
      collection(fdb, "waste_entries"),
      orderBy("created_at", "desc")
    );
    const snap = await getDocs(q);
    
    const entries = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        employee_id: data.employee_id || "",
        employeeName: data.employeeName || "Unknown",
        wasteType: data.wasteType || "",
        amount: data.amount || 0,
        dateTime: data.dateTime || "",
        created_at: data.created_at,
        location: data.location || undefined,
        imageUrl: data.imageUrl || undefined,
        status: data.status || "pending",
      } as WasteEntry;
    });
    
    console.log("[getStoredEntries] Fetched", entries.length, "entries");
    return entries;
  } catch (error) {
    console.error("[getStoredEntries] Failed to fetch entries:", error);
    throw error;
  }
}
