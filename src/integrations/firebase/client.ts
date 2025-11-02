// src/integrations/firebase/client.ts
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
