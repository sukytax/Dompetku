import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Firebase configuration dari environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

// Firebase belum bisa diinisialisasi kalau `.env` belum diisi. Jangan biarkan
// kondisi ini membuat seluruh aplikasi Vue gagal dirender (layar putih).
export const firebaseConfigured = Object.values(firebaseConfig).every(Boolean)

const app = firebaseConfigured ? initializeApp(firebaseConfig) : null

// Service Firebase hanya dibuat setelah konfigurasi lengkap.
export const auth = app ? getAuth(app) : null
export const db = app ? getFirestore(app) : null

export default app
