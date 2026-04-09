import { initializeApp, getApps, getApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getAnalytics, isSupported } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: "AIzaSyC1_4Oo77FFRfU45X0sh5wWud_MqpE3TnI",
  authDomain: "logistics-9e3e0.firebaseapp.com",
  projectId: "logistics-9e3e0",
  storageBucket: "logistics-9e3e0.firebasestorage.app",
  messagingSenderId: "556136824980",
  appId: "1:556136824980:web:cf666701e8cbe812d37481",
  measurementId: "G-HSSY7256GF",
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

export const db = getFirestore(app)
export const auth = getAuth(app)

if (typeof window !== 'undefined') {
  isSupported().then(yes => { if (yes) getAnalytics(app) })
}

export default app
