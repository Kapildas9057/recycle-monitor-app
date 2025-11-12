// src/integrations/firebase/client.ts
// Create this file and replace the YOUR_* placeholders with your Firebase config values.
// Use import { auth, db, storage } from "@/integrations/firebase/client" everywhere.

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
const firebaseConfig = {
  apiKey: "AIzaSyDWrXyw8b0K6dygiBQYlABgdGB6lGvFJKI",
  authDomain: "ecoshift-007.firebaseapp.com",
  projectId: "ecoshift-007",
  storageBucket: "ecoshift-007.firebasestorage.app",
  messagingSenderId: "588164267129",
  appId: "1:588164267129:web:59224cf7d7ac06d50568a8",
  measurementId: "G-ZT9EPJ4SXR"
};

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDWrXyw8b0K6dygiBQYlABgdGB6lGvFJKI",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "ecoshift-007.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "ecoshift-007",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "ecoshift-007.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "588164267129",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:588164267129:web:59224cf7d7ac06d50568a8",
};

// initialize once guard
let app: ReturnType<typeof initializeApp> | null = null;
try {
  // In some dev environments, duplicate initialization can throw — guard against it:
  app = initializeApp(firebaseConfig);
} catch (err) {
  // If already initialized, ignore the error and continue to get services from default app
  // This keeps multiple hot reloads from breaking initialization.
  // eslint-disable-next-line no-console
  console.warn("Firebase app init warning (maybe already initialized):", err);
}

// Export services
const auth = getAuth();
const db = getFirestore();
const storage = getStorage();

export { app, auth, db, storage };

