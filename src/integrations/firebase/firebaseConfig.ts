// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDWrXyw8b0K6dygiBQYlABgdGB6lGvFJKI",
  authDomain: "ecoshift-007.firebaseapp.com",
  projectId: "ecoshift-007",
  storageBucket: "ecoshift-007.firebasestorage.app",
  messagingSenderId: "588164267129",
  appId: "1:588164267129:web:59224cf7d7ac06d50568a8",
  measurementId: "G-ZT9EPJ4SXR"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
