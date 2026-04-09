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
    if (!loading) {
      if (!user) {
        router.replace('/login')
      } else if (role && role !== requiredRole) {
        router.replace(`/${role}`)
      }
    }
  }, [user, role, loading, requiredRole, router])

  if (loading || !user || role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 bg-brand-yellow rounded-xl flex items-center justify-center animate-pulse">
            <Package size={18} className="text-black" />
          </div>
          <div className="w-7 h-7 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-400 text-sm">Verifying access…</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
