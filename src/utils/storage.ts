// src/utils/storage.ts
import { getFirestore, collection, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDocs } from "firebase/firestore";
import type { WasteEntry } from "@/types";

const fdb = getFirestore();

export async function saveEntry(entry: Omit<WasteEntry, "id" | "created_at">, imageFile?: File) {
  // if you store images, upload to Firebase Storage first (not covered in detail here)
  const docRef = await addDoc(collection(fdb, "waste_entries"), {
    ...entry,
    status: "pending",
    created_at: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateEntryStatus(entryId: string, status: "approved" | "rejected" | "pending") {
  const ref = doc(fdb, "waste_entries", entryId);
  await updateDoc(ref, { status });
}

export async function clearAllEntries() {
  const snap = await getDocs(collection(fdb, "waste_entries"));
  const promises = snap.docs.map(d => deleteDoc(doc(fdb, "waste_entries", d.id)));
  await Promise.all(promises);
}

export async function getStoredEntries(): Promise<WasteEntry[]> {
  const snap = await getDocs(collection(fdb, "waste_entries"));
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
}
