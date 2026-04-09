'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import Sidebar from '@/components/Sidebar'
import StatCard from '@/components/StatCard'
import ShipmentTable from '@/components/ShipmentTable'
import AIInsightsPanel from '@/components/AIInsightsPanel'
import RiskBadge from '@/components/RiskBadge'
import StatusBadge from '@/components/StatusBadge'
import AuthGuard from '@/components/AuthGuard'
import AdminMap from '@/components/maps/AdminMap'
import CrimeRiskAnalyzer from '@/components/CrimeRiskAnalyzer'
import { mockShipments, shipmentsByMonth, delayDistribution } from '@/lib/mockData'
import { Shipment, subscribeToShipments } from '@/lib/firestore'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell,
} from 'recharts'
import {
  Package, AlertTriangle, Clock, Activity, ArrowUpRight,
  Users, Truck, Database, Wifi, Route, Zap, IndianRupee, LogOut } from 'lucide-react'

function AdminDashboardContent() {
  const { logout } = useAuth()
  const [shipments, setShipments] = useState<Shipment[]>(mockShipments)
  const [activeTab, setActiveTab] = useState<'all' | 'delayed' | 'transit'>('all')
  const [liveData, setLiveData] = useState(false)
  const [activeSection, setActiveSection] = useState('overview')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    const unsub = subscribeToShipments(data => {
      if (data.length > 0) { setShipments(data); setLiveData(true) }
    })
    return () => unsub()
  }, [])

  const total = shipments.length
  const delayed = shipments.filter(s => s.status === 'delayed').length
  const inTransit = shipments.filter(s => s.status === 'in_transit').length
  const avgEta = Math.round(shipments.reduce((a, b) => a + b.eta, 0) / total)
  const highRisk = shipments.filter(s => s.delay_risk === 'high').length
  const totalCost = shipments.reduce((sum, s) => sum + Math.round((s.distance || 200) * 12), 0)
  const avgCost = Math.round(totalCost / total)
  const autoPlanned = shipments.filter(s => s.ai_analysis).length
  const routesOptimized = Math.round(total * 0.75)
  const avgTimeSaved = 18

  const filtered =
    activeTab === 'all' ? shipments
    : activeTab === 'delayed' ? shipments.filter(s => s.status === 'delayed')
    : shipments.filter(s => s.status === 'in_transit')

  const statusIcon: Record<string, string> = {
    in_transit: '🚚', delayed: '⚠️', delivered: '✅', pending: '📦',
  }

  return (
    <div className="min-h-screen flex">
      <div className={`flex-1 min-w-0 transition-all duration-300`}>
        <div className="max-w-[1400px] mx-auto px-6 py-7">

          {/* Header */}
          <div className="flex items-start justify-between mb-7">
            <div>
              <h1 className="text-4xl font-bold text-[#111111] leading-tight">Manager<br />Dashboard</h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-zinc-500 text-sm">Real-time fleet overview & AI intelligence</p>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${liveData ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-500'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${liveData ? 'bg-green-500 animate-pulse' : 'bg-zinc-400'}`} />
                  {liveData ? 'Live' : 'Demo data'}
                </span>
              </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-brand-yellow rounded-full text-black font-bold text-lg shadow-sm border border-yellow-200">
                👤
              </div>
              <button onClick={logout} className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold transition-all border border-red-200">
                <LogOut size={16} />
                Logout
              </button>
            </div>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-center"><div className="text-3xl font-bold text-[#111111]">📦 {total * 12}</div><div className="text-zinc-500 text-xs mt-0.5">Total Shipments</div></div>
              <div className="text-center"><div className="text-3xl font-bold text-[#111111]">🚚 {inTransit * 8}</div><div className="text-zinc-500 text-xs mt-0.5">Active Routes</div></div>
              <div className="text-center"><div className="text-3xl font-bold text-[#111111]">⚠️ {delayed * 3}</div><div className="text-zinc-500 text-xs mt-0.5">Alerts</div></div>
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <StatCard title="Total Shipments" value={total} sub="This session"
              icon={<Package size={16} className="text-zinc-500" />}
              trend={{ value: '+12% vs last week', positive: true }} />
            <StatCard title="Delayed" value={delayed} sub={`${highRisk} high-risk`}
              icon={<AlertTriangle size={16} className="text-red-500" />}
              trend={{ value: `${delayed} need attention`, positive: false }} />
            <StatCard title="Avg ETA" value={`${avgEta} min`} sub="Across active routes"
              icon={<Clock size={16} className="text-zinc-500" />} />
            <StatCard title="In Transit" value={inTransit} sub="Currently active"
              icon={<Activity size={16} className="text-brand-yellow" />} accent
              trend={{ value: 'Live', positive: true }} />
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-12 gap-4">

            {/* Bar chart — Shipment Volume */}
            <div className="col-span-4 card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-[#111111]">Shipment Volume</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">Jan – Nov trend</p>
                </div>
                <button className="w-7 h-7 bg-zinc-100 rounded-lg flex items-center justify-center hover:bg-zinc-200">
                  <ArrowUpRight size={14} className="text-zinc-500" />
                </button>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={shipmentsByMonth} barSize={12} barGap={4}>
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 }} />
                  <Bar dataKey="total" fill="#111111" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="delayed" fill="#EAB308" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2">
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#111111]" /><span className="text-xs text-zinc-500">Total</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-brand-yellow" /><span className="text-xs text-zinc-500">Delayed</span></div>
              </div>
            </div>

            {/* Delay Distribution chart — from historical data/shipments.json */}
            <div className="col-span-4 card">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-bold text-[#111111]">Delay Distribution</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">Historical · 20 shipments</p>
                </div>
                <span className="text-[10px] bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-full">data/shipments.json</span>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={delayDistribution} barSize={28} margin={{ top: 8, bottom: 0 }}>
                  <XAxis dataKey="range" tick={{ fontSize: 10, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 }}
                    formatter={(v: number) => [`${v} shipments`, 'Count']}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {delayDistribution.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-zinc-500">On-time rate</span>
                <span className="text-sm font-bold text-green-600">65%</span>
              </div>
              <div className="w-full bg-zinc-100 rounded-full h-1.5 mt-1">
                <div className="bg-green-500 rounded-full h-1.5" style={{ width: '65%' }} />
              </div>
            </div>

            {/* AI Insights */}
            <div className="col-span-4 row-span-2">
              <AIInsightsPanel shipments={shipments} />
            </div>

            {/* Cost + Optimization + Automation row */}
            <div className="col-span-8 grid grid-cols-3 gap-4">

              {/* Cost Panel */}
              <div className="card">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 bg-brand-yellow/10 rounded-lg flex items-center justify-center">
                    <IndianRupee size={14} className="text-brand-yellow" />
                  </div>
                  <h3 className="font-bold text-[#111111] text-sm">Cost Overview</h3>
                </div>
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500">Total Est. Cost</span>
                    <span className="text-sm font-bold text-[#111111]">₹{(totalCost / 1000).toFixed(1)}K</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500">Avg per Shipment</span>
                    <span className="text-sm font-bold text-[#111111]">₹{avgCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500">Highest Cost</span>
                    <span className="text-sm font-bold text-red-600">₹{Math.max(...shipments.map(s => Math.round((s.distance || 200) * 18))).toLocaleString()}</span>
                  </div>
                  <div className="h-px bg-zinc-100" />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500">AI Savings Est.</span>
                    <span className="text-sm font-bold text-green-600">₹{Math.round(totalCost * 0.12 / 1000)}K</span>
                  </div>
                </div>
              </div>

              {/* Optimization Panel */}
              <div className="card">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Route size={14} className="text-blue-600" />
                  </div>
                  <h3 className="font-bold text-[#111111] text-sm">Optimization</h3>
                </div>
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500">Routes Optimized</span>
                    <span className="text-sm font-bold text-[#111111]">{routesOptimized} today</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500">Avg Time Saved</span>
                    <span className="text-sm font-bold text-green-600">{avgTimeSaved} mins</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500">Best Route Hits</span>
                    <span className="text-sm font-bold text-[#111111]">{Math.round(routesOptimized * 0.8)} / {routesOptimized}</span>
                  </div>
                  <div className="h-px bg-zinc-100" />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500">Reroutes Today</span>
                    <span className="text-sm font-bold text-brand-yellow">{delayed + 1}</span>
                  </div>
                </div>
              </div>

              {/* Automation Panel */}
              <div className="card">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 bg-[#111111] rounded-lg flex items-center justify-center">
                    <Zap size={14} className="text-brand-yellow" />
                  </div>
                  <h3 className="font-bold text-[#111111] text-sm">Automation</h3>
                </div>
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500">Auto-Planned</span>
                    <span className="text-sm font-bold text-green-600">100%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500">Manual Actions</span>
                    <span className="text-sm font-bold text-[#111111]">0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500">AI Assignments</span>
                    <span className="text-sm font-bold text-[#111111]">{autoPlanned}</span>
                  </div>
                  <div className="h-px bg-zinc-100" />
                  <div className="w-full bg-zinc-100 rounded-full h-1.5 mt-1">
                    <div className="bg-brand-yellow rounded-full h-1.5" style={{ width: '100%' }} />
                  </div>
                  <p className="text-[10px] text-zinc-400">100% shipments auto-planned by AI</p>
                </div>
              </div>
            </div>

            {/* Data Source Panel */}
            <div className="col-span-4 card">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-zinc-100 rounded-lg flex items-center justify-center">
                  <Database size={14} className="text-zinc-600" />
                </div>
                <h3 className="font-bold text-[#111111]">Data Sources</h3>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Historical Data', status: 'Loaded', color: 'text-green-600', bg: 'bg-green-100', icon: <Database size={12} /> },
                  { label: 'Traffic Feed', status: 'Simulated', color: 'text-blue-600', bg: 'bg-blue-100', icon: <Wifi size={12} /> },
                  { label: 'Weather Feed', status: 'Simulated', color: 'text-blue-600', bg: 'bg-blue-100', icon: <Wifi size={12} /> },
                  { label: 'Firebase Sync', status: liveData ? 'Live' : 'Connected', color: liveData ? 'text-green-600' : 'text-zinc-500', bg: liveData ? 'bg-green-100' : 'bg-zinc-100', icon: <Activity size={12} /> },
                  { label: 'Claude AI', status: 'Active', color: 'text-brand-yellow', bg: 'bg-brand-yellow/10', icon: <Zap size={12} /> },
                ].map(src => (
                  <div key={src.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <span className="text-zinc-400">{src.icon}</span>
                      {src.label}
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${src.bg} ${src.color}`}>
                      {src.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Intelligence Map — full fleet overview */}
            <div className="col-span-12 card !p-0 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100">
                <div>
                  <h3 className="font-bold text-[#111111]">Intelligence Map</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">Live fleet positions · Risk zones · Crisis simulation</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-green-600">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Live
                </div>
              </div>
              <AdminMap shipments={shipments} />
            </div>

            {/* Crime-Based Route Safety Analyzer */}
            <div className="col-span-12 card">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center">
                  <Route size={14} className="text-red-500" />
                </div>
                <h3 className="font-bold text-[#111111]">Crime-Based Route Safety Analyzer</h3>
                <span className="text-xs bg-red-50 text-red-600 font-bold px-2 py-0.5 rounded-full ml-auto">NCRB Dataset</span>
              </div>
              <CrimeRiskAnalyzer />
            </div>

            {/* Shipment table */}
            <div className="col-span-8 card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[#111111]">Shipment Tracker</h3>
                <div className="flex gap-1">
                  {(['all', 'transit', 'delayed'] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${activeTab === tab ? 'bg-[#111111] text-white' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}>
                      {tab === 'all' ? 'All' : tab === 'transit' ? 'In Transit' : 'Delayed'}
                    </button>
                  ))}
                </div>
              </div>
              <ShipmentTable shipments={filtered} />
            </div>

            {/* Live Shipment Feed */}
            <div className="col-span-4 card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[#111111]">Live Feed</h3>
                <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Live
                </span>
              </div>
              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                {shipments.slice(0, 8).map(s => (
                  <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 transition-all">
                    <span className="text-base shrink-0">{statusIcon[s.status] ?? '📦'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-[#111111]">{s.id}</span>
                        <StatusBadge status={s.status} />
                      </div>
                      <div className="text-xs text-zinc-400 truncate">{s.source} → {s.destination}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Alerts */}
            <div className="col-span-4 card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[#111111]">Live Alerts</h3>
                <span className="text-xs bg-red-100 text-red-600 font-semibold px-2 py-0.5 rounded-full">{delayed + highRisk} active</span>
              </div>
              <div className="space-y-3">
                {shipments.filter(s => s.status === 'delayed' || s.delay_risk === 'high').slice(0, 3).map(s => (
                  <div key={s.id} className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl p-3">
                    <div className="w-7 h-7 bg-red-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <AlertTriangle size={13} className="text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-[#111111]">Shipment {s.id}</span>
                        <RiskBadge risk={s.delay_risk} size="sm" />
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{s.ai_analysis}</p>
                    </div>
                  </div>
                ))}
                {shipments.filter(s => s.status === 'delivered').slice(0, 1).map(s => (
                  <div key={`d-${s.id}`} className="flex items-start gap-3 bg-green-50 border border-green-100 rounded-xl p-3">
                    <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                      <Truck size={13} className="text-green-600" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-[#111111]">Shipment {s.id}</span>
                      <p className="text-xs text-zinc-500 mt-0.5">{s.source} → {s.destination} delivered</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Drivers */}
            <div className="col-span-4 card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[#111111]">Drivers</h3>
                <Users size={15} className="text-zinc-400" />
              </div>
              <div className="space-y-3">
                {[
                  { id: 'D1', name: 'Arjun Singh', vehicle: 'Van', status: 'on_delivery', deliveries: 3 },
                  { id: 'D2', name: 'Priya Sharma', vehicle: 'Truck', status: 'on_delivery', deliveries: 2 },
                  { id: 'D3', name: 'Ravi Kumar', vehicle: 'Bike', status: 'available', deliveries: 5 },
                ].map(d => (
                  <div key={d.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-50">
                    <div className="w-9 h-9 bg-brand-yellow/20 rounded-xl flex items-center justify-center font-bold text-sm text-brand-yellow-dark shrink-0">
                      {d.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-[#111111] truncate">{d.name}</div>
                      <div className="text-xs text-zinc-400">{d.vehicle} · {d.deliveries} trips</div>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${d.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                      {d.status === 'available' ? 'Free' : 'Active'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminPage() {
  return (
    <AuthGuard requiredRole="admin">
      <AdminDashboardContent />
    </AuthGuard>
  )
}
