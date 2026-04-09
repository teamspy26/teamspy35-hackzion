'use client'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import {
  Package, Sparkles, ArrowRight, Shield, Zap, BarChart3,
  Truck, Route, Brain, ChevronDown, Star, Globe, Activity,
  X, BarChart, Users, PawPrint,
} from 'lucide-react'

// SSR-safe Three.js canvas
const Scene3D = dynamic(() => import('@/components/three/Scene3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-2 border-yellow-500/40 border-t-yellow-500 rounded-full animate-spin" />
        <p className="text-zinc-500 text-sm">Loading 3D scene…</p>
      </div>
    </div>
  ),
})

const ROLES = [
  {
    value: 'admin',
    label: 'Admin',
    subtitle: 'Manager Dashboard',
    icon: <BarChart size={28} />,
    desc: 'Monitor fleet health, AI insights, delay alerts, driver management.',
    features: ['Real-time fleet overview', 'AI risk scoring', 'Live alerts', 'Driver management'],
    highlight: true,
  },
  {
    value: 'operator',
    label: 'Operator',
    subtitle: 'Control Panel',
    icon: <Package size={28} />,
    desc: 'Create shipments, trigger AI route planning, save to Firebase.',
    features: ['Shipment creation', 'AI route planner', 'Firebase sync', 'Live tracker'],
    highlight: false,
  },
  {
    value: 'driver',
    label: 'Driver',
    subtitle: 'Execution Panel',
    icon: <Truck size={28} />,
    desc: 'View assignments, start deliveries, get AI safety suggestions.',
    features: ['Assigned deliveries', 'Start / complete', 'AI suggestions', 'Status broadcast'],
    highlight: false,
  },
  {
    value: 'client',
    label: 'Client',
    subtitle: 'Pet Transport',
    icon: <PawPrint size={28} />,
    desc: 'Book safe pet transport with AI comfort scoring, heat risk detection, and rest stop planning.',
    features: ['Pet comfort score', 'Heat risk alerts', 'Smart rest stops', 'Safe mode selection'],
    highlight: false,
  },
]

export default function LandingPage() {
  const { user, role, loading } = useAuth()
  const router = useRouter()
  const [show, setShow] = useState(false)
  const [showRoleModal, setShowRoleModal] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (user && role) {
        router.replace(`/${role}`)
      } else {
        setShow(true)
      }
    }
  }, [user, role, loading, router])

  function handleGetStarted(e: React.MouseEvent) {
    e.preventDefault()
    setShowRoleModal(true)
  }

  if (!show) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-yellow-500 rounded-2xl flex items-center justify-center animate-pulse">
            <Package size={22} className="text-black" />
          </div>
          <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white overflow-x-hidden">
      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#080808]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-yellow-500 rounded-xl flex items-center justify-center">
              <Package size={16} className="text-black" />
            </div>
            <span className="font-bold text-lg tracking-tight">
              Logi<span className="text-yellow-400">Flow</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how" className="hover:text-white transition-colors">How it works</a>
            <a href="#roles" className="hover:text-white transition-colors">Roles</a>
          </div>
          <button
            onClick={handleGetStarted}
            className="flex items-center gap-2 bg-yellow-500 text-black font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-yellow-400 transition-all"
          >
            Get Started <ArrowRight size={14} />
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col lg:flex-row pt-16">
        {/* Left: Text Content */}
        <div className="relative z-10 flex flex-col justify-center px-8 md:px-14 lg:px-20 py-16 lg:py-0 lg:w-[48%] xl:w-[45%]">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 w-fit">
            <Sparkles size={12} />
            Powered by Claude AI + Firebase
          </div>

          <h1 className="text-5xl md:text-6xl xl:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6">
            The Future of
            <br />
            <span className="text-yellow-400">Logistics</span>
            <br />
            is AI
          </h1>

          <p className="text-zinc-400 text-lg md:text-xl leading-relaxed mb-8 max-w-lg">
            Real-time fleet management with AI-powered routing, instant delay prediction,
            and role-based dashboards for Managers, Operators, and Drivers.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mb-10">
            <button
              onClick={handleGetStarted}
              className="flex items-center justify-center gap-2 bg-yellow-500 text-black font-bold text-base px-7 py-4 rounded-xl hover:bg-yellow-400 transition-all hover:scale-105 active:scale-95"
            >
              <Sparkles size={18} />
              Get Started — Free Demo
            </button>
            <a
              href="#roles"
              className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white font-semibold text-base px-7 py-4 rounded-xl hover:bg-white/10 transition-all"
            >
              View Roles <ChevronDown size={16} />
            </a>
          </div>

          {/* Social proof row */}
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="flex">
                {[0,1,2,3,4].map(i => <Star key={i} size={14} fill="#EAB308" className="text-yellow-500" />)}
              </div>
              <span className="text-xs text-zinc-500">Hackathon Ready</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <Shield size={13} className="text-green-400" />
              Role-based access
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <Activity size={13} className="text-yellow-400" />
              Live Firebase sync
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-4 mt-10 pt-8 border-t border-white/5">
            {[
              { val: '3', label: 'AI Roles', icon: <Brain size={16} className="text-yellow-400" /> },
              { val: '< 2s', label: 'AI Plan Time', icon: <Zap size={16} className="text-yellow-400" /> },
              { val: '100%', label: 'Real-time', icon: <Globe size={16} className="text-yellow-400" /> },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">{s.icon}</div>
                <div className="text-2xl font-extrabold text-white">{s.val}</div>
                <div className="text-xs text-zinc-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: 3D Scene */}
        <div className="relative lg:w-[52%] xl:w-[55%] h-[500px] lg:h-screen order-first lg:order-last">
          {/* Gradient overlay on left edge for blend */}
          <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-r from-[#080808] to-transparent pointer-events-none" />
          {/* Glow center */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
            <div className="w-[500px] h-[500px] rounded-full bg-yellow-500/5 blur-3xl" />
            <div className="absolute w-[300px] h-[300px] rounded-full bg-blue-500/5 blur-2xl translate-x-20 -translate-y-10" />
          </div>
          <Scene3D />
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-6 md:px-14 bg-[#0a0a0a] border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
              <Sparkles size={12} /> Features
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
              Everything your fleet needs
            </h2>
            <p className="text-zinc-500 text-lg max-w-xl mx-auto">
              From creation to delivery — AI handles the complexity, you handle the business.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: <Brain size={22} className="text-yellow-400" />,
                title: 'Claude AI Planner',
                desc: 'Instant ETA prediction, optimal vehicle selection, delay risk scoring, and route recommendations powered by Anthropic Claude.',
                tag: 'Core AI',
              },
              {
                icon: <Activity size={22} className="text-yellow-400" />,
                title: 'Real-time Firebase',
                desc: 'Shipment status syncs live across all 3 dashboards. Driver marks delivered → Admin and Operator see it instantly.',
                tag: 'Live Sync',
              },
              {
                icon: <Shield size={22} className="text-yellow-400" />,
                title: 'Role-Based Access',
                desc: 'Admin monitors the fleet, Operator creates and plans, Driver executes. Each role sees exactly what they need.',
                tag: 'Security',
              },
              {
                icon: <BarChart3 size={22} className="text-yellow-400" />,
                title: 'Fleet Analytics',
                desc: 'Bar charts, donut charts, risk scores, delay trends. AI-generated fleet insights on demand.',
                tag: 'Analytics',
              },
              {
                icon: <Route size={22} className="text-yellow-400" />,
                title: 'Smart Routing',
                desc: 'AI analyzes distance, weight, priority and traffic to select the best route and vehicle type automatically.',
                tag: 'Routing',
              },
              {
                icon: <Truck size={22} className="text-yellow-400" />,
                title: 'Driver Execution',
                desc: 'Driver panel with start/complete buttons, AI safety alerts, and real-time suggestions for rerouting.',
                tag: 'Execution',
              },
            ].map(f => (
              <div key={f.title}
                className="bg-white/3 border border-white/8 rounded-2xl p-6 hover:border-yellow-500/30 hover:bg-white/5 transition-all group">
                <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-yellow-500/20 transition-all">
                  {f.icon}
                </div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-white">{f.title}</h3>
                  <span className="text-[10px] font-bold bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded-full">{f.tag}</span>
                </div>
                <p className="text-zinc-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="py-24 px-6 md:px-14 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4">How it works</h2>
            <p className="text-zinc-500 text-lg">One shipment, three roles, one AI brain.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 relative">
            {/* Connector line (desktop) */}
            <div className="hidden md:block absolute top-10 left-[33%] right-[33%] h-0.5 bg-gradient-to-r from-yellow-500/30 to-yellow-500/30 z-0" />

            {[
              { step: '01', role: 'Operator', color: 'bg-yellow-500', actions: ['Fill shipment details', 'Click AI Plan Route', 'Save to Firebase'] },
              { step: '02', role: 'AI Engine', color: 'bg-[#1a1a1a] border border-yellow-500/30', actions: ['Analyzes route + load', 'Selects vehicle type', 'Scores delay risk'] },
              { step: '03', role: 'Admin + Driver', color: 'bg-blue-600', actions: ['Admin monitors live', 'Driver gets assignment', 'Status syncs instantly'] },
            ].map(s => (
              <div key={s.step} className="relative z-10 flex flex-col items-center text-center gap-4">
                <div className={`w-16 h-16 rounded-2xl ${s.color} flex items-center justify-center`}>
                  <span className="text-lg font-extrabold text-white">{s.step}</span>
                </div>
                <h3 className="text-xl font-bold">{s.role}</h3>
                <ul className="space-y-2">
                  {s.actions.map(a => (
                    <li key={a} className="flex items-center gap-2 text-sm text-zinc-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 shrink-0" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROLES ── */}
      <section id="roles" className="py-24 px-6 md:px-14 bg-[#0a0a0a] border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4">Choose your role</h2>
            <p className="text-zinc-500 text-lg">Three dashboards, one login. No sign-up needed.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { role: 'admin', label: 'Admin', icon: <BarChart3 size={28} />, desc: 'Monitor fleet health, view AI insights, track delays, manage drivers.', color: 'yellow', features: ['Real-time fleet map', 'AI risk scoring', 'Delay alerts', 'Driver management'] },
              { role: 'operator', label: 'Operator', icon: <Package size={28} />, desc: 'Create shipments, trigger AI route planning, save to Firebase with one click.', color: 'white', features: ['Shipment creation form', 'One-click AI planning', 'Firebase auto-save', 'Live shipment tracker'] },
              { role: 'driver', label: 'Driver', icon: <Truck size={28} />, desc: 'View assignments, start and complete deliveries, get AI safety suggestions.', color: 'white', features: ['Assigned deliveries', 'Start / complete buttons', 'AI route suggestions', 'Live status broadcast'] },
            ].map(r => (
              <button key={r.role} onClick={() => router.push(`/login?role=${r.role}`)}
                className={`group rounded-2xl p-7 border text-left transition-all hover:-translate-y-1 hover:shadow-2xl ${r.color === 'yellow' ? 'bg-yellow-500 border-yellow-400' : 'bg-white/3 border-white/8 hover:border-yellow-500/30'}`}>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${r.color === 'yellow' ? 'bg-black/20 text-black' : 'bg-yellow-500/10 text-yellow-400'}`}>
                  {r.icon}
                </div>
                <h3 className={`text-2xl font-extrabold mb-2 ${r.color === 'yellow' ? 'text-black' : 'text-white'}`}>{r.label}</h3>
                <p className={`text-sm leading-relaxed mb-5 ${r.color === 'yellow' ? 'text-black/70' : 'text-zinc-400'}`}>{r.desc}</p>
                <ul className="space-y-2">
                  {r.features.map(f => (
                    <li key={f} className={`flex items-center gap-2 text-sm ${r.color === 'yellow' ? 'text-black/80' : 'text-zinc-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${r.color === 'yellow' ? 'bg-black/40' : 'bg-yellow-500'} shrink-0`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className={`flex items-center gap-2 mt-6 font-bold text-sm group-hover:gap-3 transition-all ${r.color === 'yellow' ? 'text-black' : 'text-yellow-400'}`}>
                  Enter as {r.label} <ArrowRight size={14} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative inline-block mb-8">
            <div className="w-20 h-20 bg-yellow-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Sparkles size={32} className="text-yellow-400" />
            </div>
            <div className="absolute -inset-4 bg-yellow-500/5 rounded-full blur-xl" />
          </div>
          <h2 className="text-5xl md:text-6xl font-extrabold mb-6">
            Ready to optimize
            <br />
            <span className="text-yellow-400">your logistics?</span>
          </h2>
          <p className="text-zinc-400 text-xl mb-10 max-w-xl mx-auto">
            No sign-up. No setup. Just pick a role and explore the AI-powered platform.
          </p>
          <button
            onClick={handleGetStarted}
            className="inline-flex items-center gap-3 bg-yellow-500 text-black font-extrabold text-lg px-10 py-5 rounded-2xl hover:bg-yellow-400 transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(234,179,8,0.3)]"
          >
            <Sparkles size={20} />
            Get Started — Free Demo
            <ArrowRight size={20} />
          </button>
          <p className="text-zinc-600 text-sm mt-5">Demo credentials auto-filled • No account required</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-yellow-500 rounded-lg flex items-center justify-center">
              <Package size={14} className="text-black" />
            </div>
            <span className="font-bold text-white">Logi<span className="text-yellow-400">Flow</span></span>
          </div>
          <p className="text-xs text-zinc-600">
            Built with Next.js · Firebase · Claude AI · Three.js
          </p>
          <div className="flex items-center gap-1.5 text-xs text-zinc-600">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            All systems operational
          </div>
        </div>
      </footer>

      {/* ── ROLE SELECTION MODAL ── */}
      {showRoleModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowRoleModal(false)}
          />

          {/* Modal */}
          <div className="relative z-10 w-full max-w-3xl bg-[#111111] rounded-3xl border border-white/10 shadow-2xl p-8">
            {/* Close */}
            <button
              onClick={() => setShowRoleModal(false)}
              className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-zinc-400 hover:text-white transition-all"
            >
              <X size={16} />
            </button>

            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
                <Sparkles size={12} /> Choose your role
              </div>
              <h2 className="text-3xl font-extrabold text-white">Enter the Platform</h2>
              <p className="text-zinc-500 text-sm mt-2">Select a role to access your dashboard</p>
            </div>

            {/* Role cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {ROLES.map(r => (
                <button
                  key={r.value}
                  onClick={() => router.push(`/login?role=${r.value}`)}
                  className={`group rounded-2xl p-5 text-left border transition-all hover:-translate-y-1 hover:shadow-xl ${
                    r.highlight
                      ? 'bg-yellow-500 border-yellow-400 hover:bg-yellow-400'
                      : 'bg-white/5 border-white/10 hover:border-yellow-500/40 hover:bg-white/8'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                    r.highlight ? 'bg-black/20 text-black' : 'bg-yellow-500/10 text-yellow-400'
                  }`}>
                    {r.icon}
                  </div>
                  <div className={`text-xl font-extrabold mb-0.5 ${r.highlight ? 'text-black' : 'text-white'}`}>
                    {r.label}
                  </div>
                  <div className={`text-xs font-semibold mb-3 ${r.highlight ? 'text-black/60' : 'text-zinc-500'}`}>
                    {r.subtitle}
                  </div>
                  <p className={`text-xs leading-relaxed mb-4 ${r.highlight ? 'text-black/70' : 'text-zinc-400'}`}>
                    {r.desc}
                  </p>
                  <ul className="space-y-1.5">
                    {r.features.map(f => (
                      <li key={f} className={`flex items-center gap-1.5 text-xs ${r.highlight ? 'text-black/80' : 'text-zinc-400'}`}>
                        <span className={`w-1 h-1 rounded-full shrink-0 ${r.highlight ? 'bg-black/40' : 'bg-yellow-500'}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className={`flex items-center gap-1.5 mt-5 text-xs font-bold group-hover:gap-2.5 transition-all ${r.highlight ? 'text-black' : 'text-yellow-400'}`}>
                    Enter as {r.label} <ArrowRight size={13} />
                  </div>
                </button>
              ))}
            </div>

            {/* Bottom link */}
            <p className="text-center text-xs text-zinc-600 mt-6">
              New here?{' '}
              <button
                onClick={() => router.push('/login')}
                className="text-yellow-500 hover:text-yellow-400 font-semibold transition-colors"
              >
                Create an account
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
