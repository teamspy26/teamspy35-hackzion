'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { DEMO_ACCOUNTS } from '@/lib/authHelpers'
import type { Role } from '@/lib/authHelpers'
import { Package, BarChart3, Truck, Sparkles, Loader2, Eye, EyeOff, Shield, Zap } from 'lucide-react'
import clsx from 'clsx'

const roles: { role: Role; label: string; subtitle: string; icon: React.ReactNode; description: string; color: string }[] = [
  {
    role: 'admin',
    label: 'Admin',
    subtitle: 'Manager Dashboard',
    icon: <BarChart3 size={26} />,
    description: 'Monitor fleet, AI insights, alerts, shipment analytics',
    color: 'bg-[#111111] text-white',
  },
  {
    role: 'operator',
    label: 'Operator',
    subtitle: 'Control Panel',
    icon: <Package size={26} />,
    description: 'Create shipments, trigger AI planner, manage routes',
    color: 'bg-white text-[#111111]',
  },
  {
    role: 'driver',
    label: 'Driver',
    subtitle: 'Execution Panel',
    icon: <Truck size={26} />,
    description: 'View assigned routes, update delivery status, AI alerts',
    color: 'bg-white text-[#111111]',
  },
]

export default function LoginPage() {
  const { user, role, loading, loginAsRole } = useAuth()
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [signingIn, setSigningIn] = useState(false)
  const [error, setError] = useState('')

  // Already logged in → redirect
  useEffect(() => {
    if (!loading && user && role) {
      router.replace(`/${role}`)
    }
  }, [user, role, loading, router])

  async function handleLogin(r: Role) {
    setSelectedRole(r)
    setSigningIn(true)
    setError('')
    try {
      await loginAsRole(r)
      router.replace(`/${r}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Login failed. Please try again.')
      setSigningIn(false)
      setSelectedRole(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-400 text-sm">Loading…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <div className="bg-[#111111] h-14 flex items-center px-8">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-brand-yellow rounded-lg flex items-center justify-center">
            <Package size={14} className="text-black" />
          </div>
          <span className="font-bold text-white text-base">
            Logi<span className="text-brand-yellow">Flow</span>
          </span>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-zinc-400">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Demo Mode Active
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-4xl">
          {/* Hero */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-brand-yellow/20 border border-brand-yellow/30 text-yellow-800 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
              <Sparkles size={12} />
              AI-Powered Logistics Platform
            </div>
            <h1 className="text-5xl font-extrabold text-[#111111] mb-3">
              Welcome to Logi<span className="text-brand-yellow">Flow</span>
            </h1>
            <p className="text-zinc-500 text-base">
              Select your role to enter the demo. No sign-up required.
            </p>
          </div>

          {/* Role cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {roles.map(r => {
              const isLoading = signingIn && selectedRole === r.role
              const creds = DEMO_ACCOUNTS[r.role]
              const isAdmin = r.role === 'admin'

              return (
                <div
                  key={r.role}
                  className={clsx(
                    'rounded-2xl p-6 shadow-card flex flex-col gap-4 border-2 transition-all duration-200',
                    isAdmin ? 'bg-[#111111] border-transparent' : 'bg-white border-zinc-100 hover:border-brand-yellow/40',
                    signingIn && selectedRole !== r.role && 'opacity-40 pointer-events-none'
                  )}
                >
                  {/* Icon + title */}
                  <div className="flex items-start justify-between">
                    <div className={clsx(
                      'w-11 h-11 rounded-xl flex items-center justify-center',
                      isAdmin ? 'bg-brand-yellow text-black' : 'bg-zinc-100 text-zinc-600'
                    )}>
                      {r.icon}
                    </div>
                    <span className={clsx(
                      'text-xs font-semibold px-2 py-1 rounded-full',
                      isAdmin ? 'bg-white/10 text-zinc-300' : 'bg-zinc-100 text-zinc-500'
                    )}>
                      {r.subtitle}
                    </span>
                  </div>

                  <div>
                    <h2 className={clsx('text-xl font-bold mb-1', isAdmin ? 'text-white' : 'text-[#111111]')}>
                      {r.label}
                    </h2>
                    <p className={clsx('text-sm', isAdmin ? 'text-zinc-400' : 'text-zinc-500')}>
                      {r.description}
                    </p>
                  </div>

                  {/* Demo credentials */}
                  <div className={clsx(
                    'rounded-xl p-3 text-xs space-y-1 font-mono',
                    isAdmin ? 'bg-white/10' : 'bg-zinc-50 border border-zinc-100'
                  )}>
                    <div className={clsx('flex justify-between', isAdmin ? 'text-zinc-300' : 'text-zinc-500')}>
                      <span>Email</span>
                      <span className="font-semibold truncate ml-2">{creds.email}</span>
                    </div>
                    <div className={clsx('flex justify-between', isAdmin ? 'text-zinc-300' : 'text-zinc-500')}>
                      <span>Pass</span>
                      <span className="font-semibold">
                        {showPassword ? creds.password : '••••••••••'}
                      </span>
                    </div>
                  </div>

                  {/* Login button */}
                  <button
                    onClick={() => handleLogin(r.role)}
                    disabled={signingIn}
                    className={clsx(
                      'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all',
                      isAdmin
                        ? 'bg-brand-yellow text-black hover:bg-yellow-400'
                        : 'bg-[#111111] text-white hover:bg-zinc-800',
                      signingIn && 'opacity-60 cursor-not-allowed'
                    )}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        Signing in…
                      </>
                    ) : (
                      `Enter as ${r.label}`
                    )}
                  </button>
                </div>
              )
            })}
          </div>

          {/* Show/hide password toggle */}
          <div className="flex justify-center mb-4">
            <button
              onClick={() => setShowPassword(p => !p)}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
              {showPassword ? 'Hide' : 'Show'} demo credentials
            </button>
          </div>

          {error && (
            <div className="max-w-sm mx-auto bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 text-center">
              {error}
            </div>
          )}

          {/* Feature strip */}
          <div className="grid grid-cols-3 gap-3 mt-8">
            {[
              { icon: <Sparkles size={14} className="text-brand-yellow" />, label: 'Claude AI', desc: 'Real-time route planning & insights' },
              { icon: <Zap size={14} className="text-brand-yellow" />, label: 'Firebase Live', desc: 'Data syncs instantly across all roles' },
              { icon: <Shield size={14} className="text-brand-yellow" />, label: 'Role-Based', desc: '3 specialized dashboards' },
            ].map(f => (
              <div key={f.label} className="bg-white rounded-xl px-4 py-3 flex items-center gap-3 shadow-card">
                <div className="w-7 h-7 bg-brand-yellow/10 rounded-lg flex items-center justify-center shrink-0">
                  {f.icon}
                </div>
                <div>
                  <div className="text-xs font-bold text-[#111111]">{f.label}</div>
                  <div className="text-xs text-zinc-400">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
