import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from './firebase'

export type Role = 'admin' | 'operator' | 'driver' | 'client'

export async function login(email: string, password: string) {
  const { user } = await signInWithEmailAndPassword(auth, email, password)
  return user
}

export async function register(email: string, password: string, role: Role, name: string) {
  const { user } = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(user, { displayName: name })
  await setDoc(doc(db, 'users', user.uid), {
    name,
    email,
    role,
    createdAt: new Date().toISOString(),
  })
  return user
}

export async function getUserRole(uid: string): Promise<Role | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  if (snap.exists()) return snap.data().role as Role
  return null
}

export async function logout() {
  await signOut(auth)
}
