'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Settings, Bell, LayoutGrid, Package, LogOut, ChevronDown } from 'lucide-react'
import clsx from 'clsx'
import { useState } from 'react'

const navLinks = [
  { label: 'Admin', href: '/admin', role: 'admin' },
  { label: 'Operator', href: '/operator', role: 'operator' },
  { label: 'Driver', href: '/driver', role: 'driver' },
]

const roleColors: Record<string, string> = {
  admin: 'bg-purple-500',
  operator: 'bg-blue-500',
  driver: 'bg-green-500',
}

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, role, logout } = useAuth()
  const [showMenu, setShowMenu] = useState(false)

  async function handleLogout() {
    await logout()
    router.replace('/login')
  }

  const initials = user?.displayName
    ? user.displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : role?.charAt(0).toUpperCase() ?? '?'

  return (
    <nav className="bg-[#111111] text-white sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-brand-yellow rounded-lg flex items-center justify-center">
            <Package size={15} className="text-black" />
          </div>
          <span className="font-bold text-base tracking-tight">
            Logi<span className="text-brand-yellow">Flow</span>
          </span>
        </Link>

        {/* Nav links — only show if logged in */}
        {user && role && (
          <div className="flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  'px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150',
                  pathname.startsWith(link.href)
                    ? 'bg-brand-yellow text-black'
                    : 'text-zinc-400 hover:text-white hover:bg-white/10'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}

        {/* Right section */}
        <div className="flex items-center gap-2">
          {user && role ? (
            <>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-all">
                <Bell size={15} />
              </button>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setShowMenu(p => !p)}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-all rounded-lg px-3 py-1.5"
                >
                  <div className={clsx(
                    'w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold shrink-0',
                    roleColors[role] ?? 'bg-zinc-500'
                  )}>
                    {initials}
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-semibold text-white leading-none">
                      {user.displayName ?? role}
                    </div>
                    <div className="text-[10px] text-zinc-400 capitalize">{role}</div>
                  </div>
                  <ChevronDown size={12} className="text-zinc-400" />
                </button>

                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 w-44 bg-[#1c1c1c] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-white/10">
                      <div className="text-xs font-semibold text-white truncate">
                        {user.email}
                      </div>
                      <div className="text-[10px] text-zinc-400 capitalize mt-0.5">{role} account</div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-white/5 transition-all"
                    >
                      <LogOut size={14} />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 bg-brand-yellow text-black text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-yellow-400 transition-all"
            >
              Get Started
            </Link>
          )}
        </div>
      </div>

      {/* Click-away for menu */}
      {showMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
      )}
    </nav>
  )
}
