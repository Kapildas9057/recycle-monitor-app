import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDWrXyw8b0K6dygiBQYlABgdGB6lGvFJKI",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "ecoshift-007.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "ecoshift-007",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "ecoshift-007.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "588164267129",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:588164267129:web:59224cf7d7ac06d50568a8",
};

// Initialize app once (guard for HMR / hot reload)
let app: ReturnType<typeof initializeApp> | null = null;
try {
  app = initializeApp(firebaseConfig);
} catch (err) {
  // If already initialized, ignore the error. The services below will still work.
  // eslint-disable-next-line no-console
  console.warn("Firebase app init warning (maybe already initialized):", err);
}

const auth = getAuth();
const db = getFirestore();
const storage = getStorage();

export { app, auth, db, storage };
