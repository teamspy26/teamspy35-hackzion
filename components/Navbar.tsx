'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Settings, Bell, LayoutGrid, Package, Truck, BarChart3 } from 'lucide-react'
import clsx from 'clsx'

const navLinks = [
  { label: 'Overview', href: '/' },
  { label: 'Admin', href: '/admin' },
  { label: 'Operator', href: '/operator' },
  { label: 'Driver', href: '/driver' },
]

export default function Navbar() {
  const pathname = usePathname()

  const getRoleLabel = () => {
    if (pathname.startsWith('/admin')) return 'Manager'
    if (pathname.startsWith('/operator')) return 'Operator'
    if (pathname.startsWith('/driver')) return 'Driver'
    return 'Dashboard'
  }

  return (
    <nav className="bg-[#111111] text-white sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-brand-yellow rounded-lg flex items-center justify-center">
            <Package size={15} className="text-black" />
          </div>
          <span className="font-bold text-base tracking-tight">
            Logi<span className="text-brand-yellow">Flow</span>
          </span>
        </div>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                'px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150',
                pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
                  ? 'bg-brand-yellow text-black'
                  : 'text-zinc-400 hover:text-white hover:bg-white/10'
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 bg-brand-yellow text-black text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-yellow-400 transition-all">
            <Settings size={13} />
            Settings
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-all">
            <Bell size={15} />
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-all">
            <LayoutGrid size={15} />
          </button>
        </div>
      </div>
    </nav>
  )
}
