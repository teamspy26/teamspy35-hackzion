'use client'
import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import StatCard from '@/components/StatCard'
import ShipmentTable from '@/components/ShipmentTable'
import AIInsightsPanel from '@/components/AIInsightsPanel'
import RiskBadge from '@/components/RiskBadge'
import AuthGuard from '@/components/AuthGuard'
import { mockShipments, shipmentsByMonth, priorityData } from '@/lib/mockData'
import { Shipment, subscribeToShipments } from '@/lib/firestore'
import { useAuth } from '@/context/AuthContext'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { Package, AlertTriangle, Clock, Activity, ArrowUpRight, Users, Truck } from 'lucide-react'

function AdminDashboardContent() {
  const { user } = useAuth()
  const [shipments, setShipments] = useState<Shipment[]>(mockShipments)
  const [activeTab, setActiveTab] = useState<'all' | 'delayed' | 'transit'>('all')
  const [liveData, setLiveData] = useState(false)

  useEffect(() => {
    const unsub = subscribeToShipments(data => {
      if (data.length > 0) {
        setShipments(data)
        setLiveData(true)
      }
    })
    return () => unsub()
  }, [])

  const total = shipments.length
  const delayed = shipments.filter(s => s.status === 'delayed').length
  const inTransit = shipments.filter(s => s.status === 'in_transit').length
  const avgEta = Math.round(shipments.reduce((a, b) => a + b.eta, 0) / total)
  const highRisk = shipments.filter(s => s.delay_risk === 'high').length

  const filtered =
    activeTab === 'all' ? shipments
    : activeTab === 'delayed' ? shipments.filter(s => s.status === 'delayed')
    : shipments.filter(s => s.status === 'in_transit')

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-[1400px] mx-auto px-6 py-7">
        {/* Header */}
        <div className="flex items-start justify-between mb-7">
          <div>
            <h1 className="text-4xl font-bold text-[#111111] leading-tight">
              Manager<br />Dashboard
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-zinc-500 text-sm">Real-time fleet overview & AI intelligence</p>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${liveData ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-500'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${liveData ? 'bg-green-500 animate-pulse' : 'bg-zinc-400'}`} />
                {liveData ? 'Live' : 'Demo data'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-center">
              <div className="flex items-center gap-2 text-3xl font-bold text-[#111111]">
                <span>📦</span>{total * 12}
              </div>
              <div className="text-zinc-500 text-xs mt-0.5">Total Shipments</div>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-2 text-3xl font-bold text-[#111111]">
                <span>🚚</span>{inTransit * 8}
              </div>
              <div className="text-zinc-500 text-xs mt-0.5">Active Routes</div>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-2 text-3xl font-bold text-[#111111]">
                <span>⚠️</span>{delayed * 3}
              </div>
              <div className="text-zinc-500 text-xs mt-0.5">Alerts</div>
            </div>
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
          {/* Bar chart */}
          <div className="col-span-5 card">
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

          {/* Donut chart */}
          <div className="col-span-3 card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-[#111111]">Priority Mix</h3>
              <button className="w-7 h-7 bg-zinc-100 rounded-lg flex items-center justify-center hover:bg-zinc-200">
                <ArrowUpRight size={14} className="text-zinc-500" />
              </button>
            </div>
            <div className="relative">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={priorityData} cx="50%" cy="50%" innerRadius={48} outerRadius={70} paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                    {priorityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-[#111111]">{total}</span>
                <span className="text-xs text-zinc-400">Shipments</span>
              </div>
            </div>
            <div className="space-y-1.5 mt-1">
              {priorityData.map(p => (
                <div key={p.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                    <span className="text-zinc-500">{p.name}</span>
                  </div>
                  <span className="font-semibold text-[#111111]">{p.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Insights */}
          <div className="col-span-4 row-span-2">
            <AIInsightsPanel shipments={shipments} />
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

          {/* Alerts */}
          <div className="col-span-4 card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#111111]">Live Alerts</h3>
              <span className="text-xs bg-red-100 text-red-600 font-semibold px-2 py-0.5 rounded-full">{delayed + highRisk} active</span>
            </div>
            <div className="space-y-3">
              {shipments.filter(s => s.status === 'delayed' || s.delay_risk === 'high').slice(0, 4).map(s => (
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
  )
}

export default function AdminPage() {
  return (
    <AuthGuard requiredRole="admin">
      <AdminDashboardContent />
    </AuthGuard>
  )
}
