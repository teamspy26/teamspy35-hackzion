'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import type { Role } from '@/lib/authHelpers'
import { Package } from 'lucide-react'

interface Props {
  requiredRole: Role
  children: React.ReactNode
}

export default function AuthGuard({ requiredRole, children }: Props) {
  const { user, role, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    if (!user) {
      // Confirmed no session — send to login
      router.replace('/login')
      return
    }

    if (role && role !== requiredRole) {
      // Logged in but wrong dashboard — redirect to correct one
      router.replace(`/${role}`)
    }
  }, [user, role, loading, requiredRole, router])

  // Auth confirmed and role matches — render immediately
  if (!loading && user && role === requiredRole) {
    return <>{children}</>
  }

  // User is present but role not yet resolved (Firestore in-flight) — keep showing spinner, don't redirect
  // Only show full loading screen; never redirect while user exists
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#111111]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 bg-brand-yellow rounded-xl flex items-center justify-center">
          <Package size={20} className="text-black" />
        </div>
        <div className="w-7 h-7 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-400 text-sm">Loading dashboard…</p>
      </div>
    </div>
  )
}
