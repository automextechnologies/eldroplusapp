import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging } from "firebase/messaging";

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: import.meta.env.FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyC--w_4Zx7ozuhhrHn9TuLQ6QjU6peGHPg",
  authDomain: import.meta.env.FIREBASE_AUTH_DOMAIN || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "eldroplus.firebaseapp.com",
  projectId: import.meta.env.FIREBASE_PROJECT_ID || import.meta.env.VITE_FIREBASE_PROJECT_ID || "eldroplus",
  storageBucket: import.meta.env.FIREBASE_STORAGE_BUCKET || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "eldroplus.firebasestorage.app",
  messagingSenderId: import.meta.env.FIREBASE_MESSAGING_SENDER_ID || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1011847414777",
  appId: import.meta.env.FIREBASE_APP_ID || import.meta.env.VITE_FIREBASE_APP_ID || "1:1011847414777:web:4d2d28281d7670d0b7f328",
  measurementId: import.meta.env.FIREBASE_MEASUREMENT_ID || import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-S2434T7WN2"
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

let messagingInstance = null;
try {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'Notification' in window) {
    messagingInstance = getMessaging(app);
  }
} catch (err) {
  console.warn('[Firebase Messaging] Initialization skipped:', err?.message);
}
export const messaging = messagingInstance;
