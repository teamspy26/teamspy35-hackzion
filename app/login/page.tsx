'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import type { Role } from '@/lib/authHelpers'
import { Package, Loader2, Eye, EyeOff, ArrowRight } from 'lucide-react'
import clsx from 'clsx'

const ROLES: { value: Role; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'operator', label: 'Operator' },
  { value: 'driver', label: 'Driver' },
  { value: 'client', label: 'Client' },
]

function LoginForm() {
  const { user, role, loading, login, register } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [selectedRole, setSelectedRole] = useState<Role>(() => {
    const r = searchParams.get('role')
    return (r === 'admin' || r === 'operator' || r === 'driver' || r === 'client') ? r : 'admin'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && user && role) {
      router.replace(`/${role}`)
    }
  }, [user, role, loading, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      if (mode === 'login') {
        const resolvedRole = await login(email, password)
        router.replace(`/${resolvedRole}`)
      } else {
        if (!name.trim()) {
          setError('Name is required.')
          setSubmitting(false)
          return
        }
        await register(email, password, selectedRole, name.trim())
        router.replace(`/${selectedRole}`)
      }
    } catch (e: unknown) {
      setError(getFirebaseError(e))
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (submitting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#111111]">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 bg-brand-yellow rounded-2xl flex items-center justify-center">
            <Package size={28} className="text-black" />
          </div>
          <div>
            <p className="text-white text-lg font-bold text-center">
              {mode === 'login' ? 'Signing you in…' : 'Creating your account…'}
            </p>
            <p className="text-zinc-400 text-sm text-center mt-1">Just a moment</p>
          </div>
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-brand-yellow animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-brand-yellow animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-brand-yellow animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
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
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            {searchParams.get('role') && (
              <div className="inline-flex items-center gap-2 bg-brand-yellow/20 border border-brand-yellow/30 text-yellow-800 text-xs font-semibold px-3 py-1.5 rounded-full mb-4 capitalize">
                {selectedRole} Dashboard
              </div>
            )}
            <h1 className="text-3xl font-extrabold text-[#111111]">
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h1>
            <p className="text-zinc-500 text-sm mt-2">
              {mode === 'login'
                ? `Sign in to access the ${selectedRole} dashboard`
                : `Register as ${selectedRole} to access the platform`}
            </p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl p-8 shadow-card border border-zinc-100">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name (register only) */}
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    placeholder="Your full name"
                    className="w-full px-4 py-3 rounded-lg border-2 border-zinc-200 text-sm focus:border-brand-yellow focus:outline-none"
                  />
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-lg border-2 border-zinc-200 text-sm focus:border-brand-yellow focus:outline-none"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-lg border-2 border-zinc-200 text-sm focus:border-brand-yellow focus:outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Role (register only) */}
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Role</label>
                  <div className="grid grid-cols-4 gap-2">
                    {ROLES.map(r => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setSelectedRole(r.value)}
                        className={clsx(
                          'py-2.5 rounded-lg border-2 text-sm font-semibold transition-all',
                          selectedRole === r.value
                            ? 'border-brand-yellow bg-brand-yellow/10 text-[#111111]'
                            : 'border-zinc-200 text-zinc-500 hover:border-zinc-300'
                        )}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-[#111111] text-white font-bold py-3 rounded-lg hover:bg-zinc-800 transition-all"
              >
                {mode === 'login' ? 'Sign In' : 'Create Account'}
                <ArrowRight size={16} />
              </button>
            </form>
          </div>

          {/* Toggle mode */}
          <p className="text-center text-sm text-zinc-500 mt-5">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
              className="text-[#111111] font-semibold hover:text-brand-yellow transition-colors"
            >
              {mode === 'login' ? 'Register' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

function getFirebaseError(e: unknown): string {
  if (e instanceof Error) {
    const msg = (e as { code?: string }).code ?? ''
    if (msg === 'auth/user-not-found' || msg === 'auth/wrong-password' || msg === 'auth/invalid-credential')
      return 'Invalid email or password.'
    if (msg === 'auth/email-already-in-use')
      return 'An account with this email already exists.'
    if (msg === 'auth/weak-password')
      return 'Password must be at least 6 characters.'
    if (msg === 'auth/invalid-email')
      return 'Please enter a valid email address.'
    return e.message
  }
  return 'Something went wrong. Please try again.'
}

export default function LoginPage() {
  return <Suspense fallback={<div>Loading...</div>}><LoginForm /></Suspense>;
}
