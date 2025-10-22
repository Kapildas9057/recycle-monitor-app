// src/utils/authHelpers.ts
import { db } from "@/integrations/firebase/client";
import { collection, query, where, getDocs, addDoc, orderBy, limit } from "firebase/firestore";

/**
 * generateEmployeeId(type): returns an ID like EMP-000001 or ADM-000001
 * Implementation: queries users collection for last created employee_id and increments.
 */
export async function generateEmployeeId(type: "employee" | "admin"): Promise<string> {
  const prefix = type === "admin" ? "ADM" : "EMP";
  // Strategy: get the latest user doc with matching prefix and increment number.
  const usersRef = collection(db, "users");
  // Assuming we store employee_id field like "EMP-000001"
  const q = query(usersRef, orderBy("created_at", "desc"), limit(50)); // fetch recent
  const snapshot = await getDocs(q);

  // find first id with prefix numeric suffix
  let max = 0;
  snapshot.forEach(doc => {
    const data = doc.data();
    const id = data.employee_id;
    if (typeof id === "string" && id.startsWith(prefix)) {
      const parts = id.split("-");
      const num = parseInt(parts[1]);
      if (!isNaN(num) && num > max) max = num;
    }
  });

  const newNum = (max + 1).toString().padStart(6, "0");
  return `${prefix}-${newNum}`;
}

/**
 * validateEmployeeId - returns true for EMP-xxxxxx or ADM-xxxxxx
 */
export function validateEmployeeId(id: string): boolean {
  if (!id) return false;
  return /^(EMP|ADM)-\d{6}$/.test(id.trim().toUpperCase());
}

/**
 * getEmailByEmployeeId - find a user doc by employee_id and return email (or null)
 */
export async function getEmailByEmployeeId(empId: string): Promise<string | null> {
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("employee_id", "==", empId));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const data = snapshot.docs[0].data();
  return data.email || null;
}
