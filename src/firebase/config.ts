
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDPZtycmEGaCFLRknJjxb-jZoLy4rtVrF8",
  authDomain: "signal-app-2026-2511b.firebaseapp.com",
  projectId: "signal-app-2026-2511b",
  storageBucket: "signal-app-2026-2511b.firebasestorage.app",
  messagingSenderId: "816807237415",
  appId: "1:816807237415:web:2429bfb2b6e4ffdda5fb02"
};

// Initialize Firebase
export const FirebaseApp = initializeApp(firebaseConfig);

export const FirebaseAuth = getAuth(FirebaseApp)

export const FirebaseDB = getFirestore(FirebaseApp);