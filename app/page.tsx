import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { Package, BarChart3, Truck, Sparkles, ArrowRight, Shield, Zap } from 'lucide-react'

const roles = [
  {
    title: 'Admin',
    subtitle: 'Manager Dashboard',
    description: 'Monitor all shipments, view AI-generated fleet insights, track delays, and manage your entire logistics operation from one place.',
    href: '/admin',
    icon: <BarChart3 size={28} />,
    features: ['Real-time fleet overview', 'AI insights & risk scoring', 'Delay alerts', 'Driver management'],
    accent: true,
  },
  {
    title: 'Operator',
    subtitle: 'Control Panel',
    description: 'Create shipments, trigger the AI planner to get optimal routes, ETAs, and vehicle assignments, then save to the fleet.',
    href: '/operator',
    icon: <Package size={28} />,
    features: ['Create shipments', 'AI route planning', 'ETA & vehicle selection', 'Firebase sync'],
    accent: false,
  },
  {
    title: 'Driver',
    subtitle: 'Execution Panel',
    description: 'View assigned deliveries, start and complete routes, and receive real-time AI suggestions for traffic and safety.',
    href: '/driver',
    icon: <Truck size={28} />,
    features: ['View assigned routes', 'Start / complete delivery', 'Live status updates', 'AI safety alerts'],
    accent: false,
  },
]

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-[1400px] mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-brand-yellow/20 border border-brand-yellow/40 text-yellow-800 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
            <Sparkles size={14} />
            AI-Powered Logistics Optimization
          </div>
          <h1 className="text-6xl font-extrabold text-[#111111] leading-tight mb-4">
            Logi<span className="text-brand-yellow">Flow</span>
          </h1>
          <p className="text-zinc-500 text-lg max-w-xl mx-auto">
            A role-based, AI-driven logistics system. Choose your role to access your specialized dashboard.
          </p>
        </div>

        {/* Role cards */}
        <div className="grid grid-cols-3 gap-5 mb-12">
          {roles.map(role => (
            <Link key={role.href} href={role.href} className="group block">
              <div
                className={`rounded-2xl p-6 h-full transition-all duration-200 group-hover:shadow-card-hover group-hover:-translate-y-1 ${
                  role.accent
                    ? 'bg-[#111111] text-white'
                    : 'bg-white shadow-card'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                    role.accent ? 'bg-brand-yellow text-black' : 'bg-zinc-100 text-zinc-600'
                  }`}
                >
                  {role.icon}
                </div>
                <div className="mb-1">
                  <span className={`text-xs font-semibold uppercase tracking-widest ${role.accent ? 'text-zinc-400' : 'text-zinc-400'}`}>
                    {role.subtitle}
                  </span>
                </div>
                <h2 className={`text-2xl font-bold mb-3 ${role.accent ? 'text-white' : 'text-[#111111]'}`}>
                  {role.title}
                </h2>
                <p className={`text-sm leading-relaxed mb-5 ${role.accent ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  {role.description}
                </p>
                <ul className="space-y-2 mb-6">
                  {role.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <div
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          role.accent ? 'bg-brand-yellow' : 'bg-[#111111]'
                        }`}
                      />
                      <span className={role.accent ? 'text-zinc-300' : 'text-zinc-600'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <div
                  className={`flex items-center gap-2 text-sm font-bold group-hover:gap-3 transition-all ${
                    role.accent ? 'text-brand-yellow' : 'text-[#111111]'
                  }`}
                >
                  Enter Dashboard
                  <ArrowRight size={15} />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              icon: <Sparkles size={18} className="text-brand-yellow" />,
              title: 'Claude AI Brain',
              desc: 'Anthropic Claude powers real-time route planning, delay risk assessment, and fleet insights',
            },
            {
              icon: <Zap size={18} className="text-brand-yellow" />,
              title: 'Firebase Real-time',
              desc: 'All shipment data syncs instantly across Admin, Operator, and Driver via Firestore',
            },
            {
              icon: <Shield size={18} className="text-brand-yellow" />,
              title: 'Role-Based Access',
              desc: 'Three specialized dashboards — each optimized for its role in the logistics chain',
            },
          ].map(f => (
            <div key={f.title} className="card flex items-start gap-4">
              <div className="w-9 h-9 bg-brand-yellow/10 rounded-xl flex items-center justify-center shrink-0">
                {f.icon}
              </div>
              <div>
                <div className="font-bold text-[#111111] mb-1">{f.title}</div>
                <p className="text-sm text-zinc-500">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
