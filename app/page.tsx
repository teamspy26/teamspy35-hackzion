'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Package } from 'lucide-react'

export default function Home() {
  const { user, role, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user && role) {
        router.replace(`/${role}`)
      } else {
        router.replace('/login')
      }
    }
  }, [user, role, loading, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 bg-brand-yellow rounded-2xl flex items-center justify-center animate-pulse">
          <Package size={22} className="text-black" />
        </div>
        <div className="w-8 h-8 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-400 text-sm">Starting LogiFlow…</p>
      </div>
    </div>
  )
}
