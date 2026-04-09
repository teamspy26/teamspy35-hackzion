'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { getUserRole, logout as firebaseLogout, loginAsRole as firebaseLoginAsRole } from '@/lib/authHelpers'
import type { Role } from '@/lib/authHelpers'

interface AuthContextType {
  user: User | null
  role: Role | null
  loading: boolean
  loginAsRole: (role: Role) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  loginAsRole: async () => {},
  logout: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        const r = await getUserRole(firebaseUser.uid)
        setRole(r)
      } else {
        setRole(null)
      }
      setLoading(false)
    })
    return () => unsub()
  }, [])

  async function loginAsRole(r: Role) {
    setLoading(true)
    const u = await firebaseLoginAsRole(r)
    setUser(u)
    setRole(r)
    setLoading(false)
  }

  async function logout() {
    await firebaseLogout()
    setUser(null)
    setRole(null)
  }

  return (
    <AuthContext.Provider value={{ user, role, loading, loginAsRole, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
