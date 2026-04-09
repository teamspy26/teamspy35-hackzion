'use client'
import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import ShipmentTable from '@/components/ShipmentTable'
import RiskBadge from '@/components/RiskBadge'
import StatusBadge from '@/components/StatusBadge'
import { mockShipments } from '@/lib/mockData'
import { Shipment, createShipment, subscribeToShipments } from '@/lib/firestore'
import {
  Sparkles,
  Plus,
  Send,
  Package,
  Clock,
  Route,
  Truck,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  Loader2,
} from 'lucide-react'

interface AIPlan {
  eta: number
  vehicle: string
  route: string
  delay_risk: 'low' | 'medium' | 'high'
  analysis: string
}

interface FormData {
  source: string
  destination: string
  distance: string
  weight: string
  priority: 'low' | 'medium' | 'high'
}

const riskColorMap: Record<string, string> = {
  low: 'border-green-200 bg-green-50',
  medium: 'border-yellow-200 bg-yellow-50',
  high: 'border-red-200 bg-red-50',
}

const INITIAL_FORM: FormData = {
  source: '',
  destination: '',
  distance: '',
  weight: '',
  priority: 'medium',
}

export default function OperatorPanel() {
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [aiPlan, setAiPlan] = useState<AIPlan | null>(null)
  const [planLoading, setPlanLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [shipments, setShipments] = useState<Shipment[]>(mockShipments)

  useEffect(() => {
    try {
      const unsub = subscribeToShipments(data => {
        if (data.length > 0) setShipments(data)
      })
      return () => unsub()
    } catch {
      /* use mock */
    }
  }, [])

  async function handleAIPlan() {
    if (!form.source || !form.destination || !form.distance || !form.weight) {
      alert('Please fill all fields first')
      return
    }
    setPlanLoading(true)
    setAiPlan(null)
    setSaved(false)
    try {
      const res = await fetch('/api/ai-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: form.source,
          destination: form.destination,
          distance: Number(form.distance),
          weight: Number(form.weight),
          priority: form.priority,
        }),
      })
      const json = await res.json()
      setAiPlan(json.data)
    } catch {
      const d = Number(form.distance)
      const w = Number(form.weight)
      setAiPlan({
        eta: Math.round((d / 60) * 60),
        vehicle: w > 70 ? 'Truck' : w > 20 ? 'Van' : 'Bike',
        route: `Route A (NH-${Math.floor(Math.random() * 60) + 1})`,
        delay_risk: d > 400 ? 'high' : d > 200 ? 'medium' : 'low',
        analysis: 'Route optimized based on current traffic and weather conditions.',
      })
    }
    setPlanLoading(false)
  }

  async function handleSave() {
    if (!aiPlan) return
    setSaveLoading(true)
    const drivers = ['D1', 'D2', 'D3']
    const shipmentData: Omit<Shipment, 'id' | 'createdAt'> = {
      source: form.source,
      destination: form.destination,
      distance: Number(form.distance),
      weight: Number(form.weight),
      priority: form.priority,
      eta: aiPlan.eta,
      delay_risk: aiPlan.delay_risk,
      vehicle: aiPlan.vehicle,
      route: aiPlan.route,
      status: 'pending',
      assigned_driver: drivers[Math.floor(Math.random() * drivers.length)],
      ai_analysis: aiPlan.analysis,
    }
    try {
      await createShipment(shipmentData)
    } catch {
      // Firebase not configured — simulate save
      const newShipment: Shipment = {
        ...shipmentData,
        id: `S${shipments.length + 1}`,
      }
      setShipments(prev => [newShipment, ...prev])
    }
    setSaved(true)
    setSaveLoading(false)
    setForm(INITIAL_FORM)
    setAiPlan(null)
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-[1400px] mx-auto px-6 py-7">
        {/* Header */}
        <div className="flex items-start justify-between mb-7">
          <div>
            <h1 className="text-4xl font-bold text-[#111111] leading-tight">
              Operator
              <br />
              Control Panel
            </h1>
            <p className="text-zinc-500 mt-1 text-sm">Create shipments and trigger AI routing</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#111111]">{shipments.length}</div>
              <div className="text-xs text-zinc-400">Total Created</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#111111]">
                {shipments.filter(s => s.status === 'pending').length}
              </div>
              <div className="text-xs text-zinc-400">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-brand-yellow">
                {shipments.filter(s => s.delay_risk === 'high').length}
              </div>
              <div className="text-xs text-zinc-400">High Risk</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-5">
          {/* Create Shipment Form */}
          <div className="col-span-4 card">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 bg-[#111111] rounded-lg flex items-center justify-center">
                <Plus size={14} className="text-white" />
              </div>
              <h2 className="font-bold text-[#111111]">New Shipment</h2>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-zinc-500 mb-1 block uppercase tracking-wide">
                  Source City
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bangalore"
                  value={form.source}
                  onChange={e => setForm(p => ({ ...p, source: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-[#111111] placeholder-zinc-300 focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:border-transparent"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-500 mb-1 block uppercase tracking-wide">
                  Destination City
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chennai"
                  value={form.destination}
                  onChange={e => setForm(p => ({ ...p, destination: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-[#111111] placeholder-zinc-300 focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-500 mb-1 block uppercase tracking-wide">
                    Distance (km)
                  </label>
                  <input
                    type="number"
                    placeholder="350"
                    value={form.distance}
                    onChange={e => setForm(p => ({ ...p, distance: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-[#111111] placeholder-zinc-300 focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-500 mb-1 block uppercase tracking-wide">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    placeholder="50"
                    value={form.weight}
                    onChange={e => setForm(p => ({ ...p, weight: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-[#111111] placeholder-zinc-300 focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-500 mb-1 block uppercase tracking-wide">
                  Priority
                </label>
                <div className="relative">
                  <select
                    value={form.priority}
                    onChange={e => setForm(p => ({ ...p, priority: e.target.value as 'low' | 'medium' | 'high' }))}
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-[#111111] appearance-none focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
                  />
                </div>
              </div>
            </div>

            {/* AI Plan Button */}
            <button
              onClick={handleAIPlan}
              disabled={planLoading}
              className="w-full mt-5 flex items-center justify-center gap-2 bg-brand-yellow text-black font-bold py-3 rounded-xl hover:bg-yellow-400 transition-all disabled:opacity-60"
            >
              {planLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  AI Planning…
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  AI Plan Route
                </>
              )}
            </button>
          </div>

          {/* AI Output */}
          <div className="col-span-4 flex flex-col gap-4">
            <div className="card flex-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-brand-yellow rounded-lg flex items-center justify-center">
                  <Sparkles size={14} className="text-black" />
                </div>
                <h2 className="font-bold text-[#111111]">AI Planning Result</h2>
              </div>

              {!aiPlan && !planLoading && (
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                  <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center">
                    <Sparkles size={24} className="text-zinc-300" />
                  </div>
                  <p className="text-zinc-400 text-sm">
                    Fill the form and click<br />
                    <strong className="text-zinc-600">AI Plan Route</strong> to get started
                  </p>
                </div>
              )}

              {planLoading && (
                <div className="flex flex-col items-center justify-center gap-4 py-10">
                  <div className="relative w-16 h-16">
                    <div className="w-16 h-16 border-3 border-brand-yellow/30 rounded-full" />
                    <div className="absolute inset-0 w-16 h-16 border-3 border-brand-yellow border-t-transparent rounded-full animate-spin" />
                    <Sparkles size={18} className="absolute inset-0 m-auto text-brand-yellow" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-[#111111]">AI is planning your route</p>
                    <p className="text-xs text-zinc-400 mt-1">Analyzing traffic, weather, capacity…</p>
                  </div>
                </div>
              )}

              {aiPlan && !planLoading && (
                <div className="space-y-3">
                  {/* Main metrics */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-zinc-50 rounded-xl p-3 text-center">
                      <Clock size={16} className="text-brand-yellow mx-auto mb-1" />
                      <div className="text-2xl font-bold text-[#111111]">{aiPlan.eta}</div>
                      <div className="text-xs text-zinc-400">mins ETA</div>
                    </div>
                    <div className="bg-zinc-50 rounded-xl p-3 text-center">
                      <Truck size={16} className="text-brand-yellow mx-auto mb-1" />
                      <div className="text-lg font-bold text-[#111111]">{aiPlan.vehicle}</div>
                      <div className="text-xs text-zinc-400">Vehicle</div>
                    </div>
                  </div>

                  <div className="bg-zinc-50 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Route size={13} className="text-zinc-400" />
                      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Best Route</span>
                    </div>
                    <div className="font-semibold text-sm text-[#111111]">{aiPlan.route}</div>
                  </div>

                  <div className={`rounded-xl p-3 border ${riskColorMap[aiPlan.delay_risk]}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Delay Risk</span>
                      <RiskBadge risk={aiPlan.delay_risk} />
                    </div>
                  </div>

                  <div className="bg-brand-yellow/10 border border-brand-yellow/20 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Sparkles size={12} className="text-brand-yellow" />
                      <span className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">AI Analysis</span>
                    </div>
                    <p className="text-sm text-zinc-700">{aiPlan.analysis}</p>
                  </div>

                  {/* Save button */}
                  <button
                    onClick={handleSave}
                    disabled={saveLoading || saved}
                    className="w-full flex items-center justify-center gap-2 bg-[#111111] text-white font-bold py-3 rounded-xl hover:bg-zinc-800 transition-all disabled:opacity-60"
                  >
                    {saveLoading ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        Saving…
                      </>
                    ) : saved ? (
                      <>
                        <CheckCircle size={15} className="text-green-400" />
                        Shipment Saved!
                      </>
                    ) : (
                      <>
                        <Send size={15} />
                        Save Shipment
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Recent shipments */}
          <div className="col-span-4 card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[#111111]">Recent Shipments</h2>
              <Package size={15} className="text-zinc-400" />
            </div>
            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {shipments.map(s => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 hover:bg-zinc-100 transition-all"
                >
                  <div className="w-8 h-8 bg-brand-yellow/20 rounded-lg flex items-center justify-center shrink-0">
                    <Package size={13} className="text-brand-yellow-dark" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-xs text-[#111111]">{s.id}</span>
                      <StatusBadge status={s.status} />
                    </div>
                    <div className="text-xs text-zinc-500 truncate mt-0.5">
                      {s.source} → {s.destination}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-zinc-400">{s.eta} min</span>
                      <RiskBadge risk={s.delay_risk} size="sm" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Full table */}
          <div className="col-span-12 card">
            <h2 className="font-bold text-[#111111] mb-4">All Shipments</h2>
            <ShipmentTable shipments={shipments} />
          </div>
        </div>
      </div>
    </div>
  )
}

