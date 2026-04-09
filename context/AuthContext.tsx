'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { getUserRole, login as firebaseLogin, register as firebaseRegister, logout as firebaseLogout } from '@/lib/authHelpers'
import type { Role } from '@/lib/authHelpers'

const ROLE_KEY = 'lf_role'

function getCachedRole(): Role | null {
  if (typeof window === 'undefined') return null
  return (localStorage.getItem(ROLE_KEY) as Role) || null
}

function setCachedRole(role: Role | null) {
  if (typeof window === 'undefined') return
  if (role) localStorage.setItem(ROLE_KEY, role)
  else localStorage.removeItem(ROLE_KEY)
}

interface AuthContextType {
  user: User | null
  role: Role | null
  loading: boolean
  login: (email: string, password: string) => Promise<Role>
  register: (email: string, password: string, role: Role, name: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  login: async () => { throw new Error('not ready') },
  register: async () => {},
  logout: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  // Seed role from localStorage immediately — avoids Firestore round-trip flash on refresh
  const [role, setRole] = useState<Role | null>(getCachedRole())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        // Try Firestore first; fall back to localStorage cache if it fails
        try {
          const r = await getUserRole(firebaseUser.uid)
          if (r) {
            // Firestore is authoritative when it has the doc
            setRole(r)
            setCachedRole(r)
          }
          // If r is null (doc not written yet during registration), keep whatever
          // role is already in state (set optimistically by register/login above)
        } catch {
          // Firestore read failed — keep existing state/cache, don't wipe role
        }
      } else {
        // Explicitly signed out
        setUser(null)
        setRole(null)
        setCachedRole(null)
      }
      setLoading(false)
    })
    return () => unsub()
  }, [])

  async function login(email: string, password: string): Promise<Role> {
    const u = await firebaseLogin(email, password)
    const r = await getUserRole(u.uid)
    if (!r) throw new Error('No role assigned to this account.')
    setUser(u)
    setRole(r)
    setCachedRole(r)
    return r
  }

  async function register(email: string, password: string, role: Role, name: string) {
    // Set cache BEFORE creating account so onAuthStateChanged picks up the role
    // when it fires mid-way through createUserWithEmailAndPassword (before setDoc runs)
    setCachedRole(role)
    setRole(role)
    const u = await firebaseRegister(email, password, role, name)
    setUser(u)
  }

  async function logout() {
    await firebaseLogout()
    setUser(null)
    setRole(null)
    setCachedRole(null)
  }

  return (
    <AuthContext.Provider value={{ user, role, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
