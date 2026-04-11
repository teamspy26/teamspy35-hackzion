'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import type { Role } from '@/lib/authHelpers'
import {
  LayoutDashboard, Package, BarChart3, Truck, Sparkles,
  AlertTriangle, Users, Route, Plus, CheckCircle,
  Navigation, LogOut, ChevronLeft, ChevronRight, PawPrint,
} from 'lucide-react'
import clsx from 'clsx'
import { useState } from 'react'

interface NavItem {
  label: string
  icon: React.ReactNode
  section: string
}

const NAV_ITEMS: Record<Role, NavItem[]> = {
  admin: [
    { label: 'Overview', icon: <LayoutDashboard size={18} />, section: 'overview' },
    { label: 'Shipments', icon: <Package size={18} />, section: 'shipments' },
    { label: 'Analytics', icon: <BarChart3 size={18} />, section: 'analytics' },
    { label: 'Drivers', icon: <Users size={18} />, section: 'drivers' },
    { label: 'AI Insights', icon: <Sparkles size={18} />, section: 'ai' },
    { label: 'Live Alerts', icon: <AlertTriangle size={18} />, section: 'alerts' },
  ],
  operator: [
    { label: 'Overview', icon: <LayoutDashboard size={18} />, section: 'overview' },
    { label: 'New Shipment', icon: <Plus size={18} />, section: 'new' },
    { label: 'AI Planner', icon: <Sparkles size={18} />, section: 'ai' },
    { label: 'All Shipments', icon: <Package size={18} />, section: 'shipments' },
  ],
  client: [
    { label: 'Overview', icon: <LayoutDashboard size={18} />, section: 'overview' },
    { label: 'Pet Transport', icon: <PawPrint size={18} />, section: 'pet' },
    { label: 'General Freight', icon: <Package size={18} />, section: 'freight' },
    { label: 'My Orders', icon: <Package size={18} />, section: 'orders' },
    { label: 'Track Order', icon: <Route size={18} />, section: 'track' },
  ],
}

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  operator: 'Operator',
  client: 'Client',
}

const ROLE_COLORS: Record<Role, string> = {
  admin: 'bg-purple-500',
  operator: 'bg-blue-500',
  client: 'bg-orange-500',
}

interface Props {
  activeSection: string
  onSectionChange: (section: string) => void
  onCollapse?: (collapsed: boolean) => void
}

export default function Sidebar({ activeSection, onSectionChange, onCollapse }: Props) {
  const { user, role, logout } = useAuth()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  function toggleCollapse() {
    const next = !collapsed
    setCollapsed(next)
    onCollapse?.(next)
  }

  const items = role ? NAV_ITEMS[role] : []
  const initials = user?.displayName
    ? user.displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : role?.charAt(0).toUpperCase() ?? '?'

  async function handleLogout() {
    await logout()
    router.replace('/login')
  }

  return (
    <aside className={clsx(
      'fixed left-0 top-0 h-screen bg-[#111111] flex flex-col z-50 transition-all duration-300',
      collapsed ? 'w-16' : 'w-60'
    )}>
      {/* Logo */}
      <div className={clsx(
        'h-16 flex items-center border-b border-white/10 shrink-0',
        collapsed ? 'justify-center px-0' : 'px-5 gap-3'
      )}>
        <div className="w-8 h-8 bg-brand-yellow rounded-lg flex items-center justify-center shrink-0">
          <Package size={15} className="text-black" />
        </div>
        {!collapsed && (
          <span className="font-bold text-white text-base">
            Logi<span className="text-brand-yellow">Flow</span>
          </span>
        )}
      </div>

      {/* Role badge */}
      {!collapsed && role && (
        <div className="mx-4 mt-4 mb-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2.5">
          <div className={clsx('w-2 h-2 rounded-full shrink-0', ROLE_COLORS[role])} />
          <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">
            {ROLE_LABELS[role]} Dashboard
          </span>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {items.map(item => {
          const active = activeSection === item.section
          return (
            <button
              key={item.section}
              onClick={() => onSectionChange(item.section)}
              className={clsx(
                'w-full flex items-center gap-3 rounded-xl transition-all duration-150 group',
                collapsed ? 'justify-center px-0 py-3' : 'px-3 py-2.5',
                active
                  ? 'bg-brand-yellow text-black'
                  : 'text-zinc-400 hover:text-white hover:bg-white/10'
              )}
              title={collapsed ? item.label : undefined}
            >
              <span className="shrink-0">{item.icon}</span>
              {!collapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="px-2 pb-2">
        <button
          onClick={toggleCollapse}
          className={clsx(
            'w-full flex items-center gap-3 rounded-xl py-2.5 text-zinc-500 hover:text-white hover:bg-white/10 transition-all',
            collapsed ? 'justify-center' : 'px-3'
          )}
        >
          {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span className="text-xs font-medium">Collapse</span></>}
        </button>
      </div>

      {/* User + Logout */}
      <div className="border-t border-white/10 p-3 shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2.5 mb-2 px-1">
            <div className={clsx(
              'w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0',
              role ? ROLE_COLORS[role] : 'bg-zinc-600'
            )}>
              {initials}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate">
                {user?.displayName ?? user?.email?.split('@')[0] ?? 'User'}
              </div>
              <div className="text-[10px] text-zinc-400 truncate">{user?.email}</div>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={clsx(
            'w-full flex items-center gap-2.5 rounded-xl py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all',
            collapsed ? 'justify-center' : 'px-3'
          )}
          title={collapsed ? 'Sign out' : undefined}
        >
          <LogOut size={16} className="shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Sign out</span>}
        </button>
      </div>
    </aside>
  )
}
