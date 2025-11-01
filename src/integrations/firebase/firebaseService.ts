import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  DocumentData,
} from "firebase/firestore";
import { db } from "./client";

// Type for your waste entry
export interface WasteEntry {
  employeeId: string;
  wasteType: string;
  amount: number;
  dateTime: string;
  location: string;
}

// Add new waste entry
export async function addWasteEntry(entryData: WasteEntry): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "wasteEntries"), entryData);
    console.log("Waste entry added with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error adding waste entry:", error);
    throw error;
  }
}

// Get all waste entries
export async function getAllWasteEntries(): Promise<DocumentData[]> {
  try {
    const q = query(collection(db, "wasteEntries"), orderBy("dateTime", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching waste entries:", error);
    throw error;
  }
}

// Get entries by employee
export async function getEmployeeWasteEntries(employeeId: string): Promise<DocumentData[]> {
  try {
    const q = query(
      collection(db, "wasteEntries"),
      where("employeeId", "==", employeeId),
      orderBy("dateTime", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching employee waste entries:", error);
    throw error;
  }
}
