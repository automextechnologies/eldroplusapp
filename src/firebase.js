import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_FIREBASE_API_KEY) || "AIzaSyC--w_4Zx7ozuhhrHn9TuLQ6QjU6peGHPg",
  authDomain: (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) || "eldroplus.firebaseapp.com",
  projectId: (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_FIREBASE_PROJECT_ID) || "eldroplus",
  storageBucket: (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) || "eldroplus.firebasestorage.app",
  messagingSenderId: (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) || "1011847414777",
  appId: (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_FIREBASE_APP_ID) || "1:1011847414777:web:4d2d28281d7670d0b7f328",
  measurementId: (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) || "G-S2434T7WN2"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

let analyticsInstance = null;
try {
  if (typeof window !== 'undefined') {
    analyticsInstance = getAnalytics(app);
  }
} catch (err) {
  console.warn('[Firebase Analytics] Initialization skipped:', err?.message);
}
export const analytics = analyticsInstance;

