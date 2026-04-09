import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from './firebase'

export type Role = 'admin' | 'operator' | 'driver'

export const DEMO_ACCOUNTS: Record<Role, { email: string; password: string; name: string; driverId?: string }> = {
  admin: {
    email: 'admin@logiflow.demo',
    password: 'Demo@12345',
    name: 'Alex Manager',
  },
  operator: {
    email: 'operator@logiflow.demo',
    password: 'Demo@12345',
    name: 'Sam Operator',
  },
  driver: {
    email: 'driver@logiflow.demo',
    password: 'Demo@12345',
    name: 'Arjun Singh',
    driverId: 'D1',
  },
}

export async function loginAsRole(role: Role) {
  const account = DEMO_ACCOUNTS[role]

  let userCredential
  try {
    // Try sign in first
    userCredential = await signInWithEmailAndPassword(auth, account.email, account.password)
  } catch {
    // Account doesn't exist — create it
    userCredential = await createUserWithEmailAndPassword(auth, account.email, account.password)
    await updateProfile(userCredential.user, { displayName: account.name })

    // Save role to Firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      name: account.name,
      email: account.email,
      role,
      driverId: account.driverId ?? null,
      createdAt: new Date().toISOString(),
    })
  }

  return userCredential.user
}

export async function getUserRole(uid: string): Promise<Role | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  if (snap.exists()) return snap.data().role as Role
  return null
}

export async function logout() {
  await signOut(auth)
}
