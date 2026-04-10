'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import Sidebar from '@/components/Sidebar'
import ShipmentTable from '@/components/ShipmentTable'
import RiskBadge from '@/components/RiskBadge'
import StatusBadge from '@/components/StatusBadge'
import AuthGuard from '@/components/AuthGuard'
import { mockShipments } from '@/lib/mockData'
import { Shipment, createShipment, subscribeToShipments, updateShipmentStatus } from '@/lib/firestore'
import {
  Sparkles, Plus, Send, Package, Clock, Route, Truck,
  CheckCircle, ChevronDown, Loader2, CloudRain, Wind,
  IndianRupee, User, Zap, RefreshCw, CalendarClock,
  Database, Wifi, Brain, Server, BarChart2,
  PawPrint, AlertTriangle, Shield, Train, LogOut } from 'lucide-react'
import OperatorMap from '@/components/maps/OperatorMap'
import VisualIntelligence from '@/components/VisualIntelligence'
import { getTraffic, getWeather, TRAFFIC_META, WEATHER_META, getScheduledDelivery } from '@/lib/realtime'

interface PetPlan {
  comfort_score: number
  risk: 'LOW' | 'MEDIUM' | 'HIGH'
  heat_risk: 'LOW' | 'MEDIUM' | 'HIGH'
  safe_mode: string
  safe_mode_reason: string
  eta_minutes: number
  alerts: string[]
  suggestions: string[]
  rest_stops: Array<{ stop: number; at_km: number; after_minutes: number; location: string; purpose: string }>
  analysis: string
}

interface AIPlan {
  eta: number
  vehicle: string
  route: string
  alternate_route: string
  route_eta: number
  alternate_route_eta: number
  delay_risk: 'low' | 'medium' | 'high'
  cost: number
  assigned_driver: string
  analysis: string
}

interface FormData {
  source: string
  destination: string
  distance: string
  weight: string
  priority: 'low' | 'medium' | 'high'
  traffic: 'low' | 'medium' | 'high'
  weather: 'clear' | 'rain' | 'storm'
}

const INITIAL_FORM: FormData = {
  source: '', destination: '', distance: '', weight: '',
  priority: 'medium', traffic: 'medium', weather: 'clear',
}

const riskColorMap: Record<string, string> = {
  low: 'border-green-200 bg-green-50',
  medium: 'border-yellow-200 bg-yellow-50',
  high: 'border-red-200 bg-red-50',
}

function OperatorContent() {
  const { logout } = useAuth()
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [aiPlan, setAiPlan] = useState<AIPlan | null>(null)
  const [planLoading, setPlanLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [shipments, setShipments] = useState<Shipment[]>(mockShipments)
  const [liveData, setLiveData] = useState(false)
  const [activeSection, setActiveSection] = useState('new')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [scheduledTime, setScheduledTime] = useState('')
  const [petMode, setPetMode] = useState(false)
  const [petType, setPetType] = useState<'dog' | 'cat'>('dog')
  const [petAge, setPetAge] = useState('')
  const [petPlan, setPetPlan] = useState<PetPlan | null>(null)
  const [mapShipment, setMapShipment] = useState<Shipment | null>(null)

  // Auto-populate traffic & weather on mount from simulated real-time feed
  useEffect(() => {
    setForm(p => ({ ...p, traffic: getTraffic(), weather: getWeather() }))
  }, [])

  function refreshConditions() {
    setForm(p => ({ ...p, traffic: getTraffic(), weather: getWeather() }))
  }

  useEffect(() => {
    const unsub = subscribeToShipments(data => {
      if (data.length > 0) { setShipments(data); setLiveData(true) }
    })
    return () => unsub()
  }, [])

  async function handleApproveQuote(id: string, price: number) {
    if (!id) return;
    try {
      await updateShipmentStatus(id, 'pending' as any);
    } catch(e) {
      console.error('Failed to approve quote', e);
    }
  }

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
          source: form.source, destination: form.destination,
          distance: Number(form.distance), weight: Number(form.weight),
          priority: form.priority, traffic: form.traffic, weather: form.weather,
        }),
      })
      const json = await res.json()
      setAiPlan(json.data)
      setScheduledTime(getScheduledDelivery(json.data.eta))
      setMapShipment({
        id: 'PREVIEW',
        source: form.source, destination: form.destination,
        distance: Number(form.distance), weight: Number(form.weight),
        priority: form.priority, eta: json.data.eta,
        delay_risk: json.data.delay_risk, vehicle: json.data.vehicle,
        route: json.data.route, status: 'in_transit',
        assigned_driver: json.data.assigned_driver,
        ai_analysis: json.data.analysis,
      })
      // If pet mode is on, also call pet safety module
      if (petMode) {
        try {
          const petRes = await fetch('/api/pet-plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pet_type: petType,
              weight: Number(form.weight),
              age: Number(petAge) || 3,
              source: form.source, destination: form.destination,
              distance: Number(form.distance),
              temperature: 35,
            }),
          })
          const petJson = await petRes.json()
          setPetPlan(petJson.data)
        } catch { /* pet plan fails silently */ }
      }
    } catch {
      const d = Number(form.distance), w = Number(form.weight)
      const vehicle = w > 70 ? 'Truck' : w > 20 ? 'Van' : 'Bike'
      const eta = Math.round((d / 60) * 60)
      const risk: 'low' | 'medium' | 'high' = d > 400 ? 'high' : d > 200 ? 'medium' : 'low'
      setAiPlan({
        eta, vehicle,
        route: `Route A — NH-${Math.floor(Math.random() * 60) + 1}`,
        alternate_route: `Route B — NH-${Math.floor(Math.random() * 60) + 1}`,
        route_eta: eta,
        alternate_route_eta: Math.round(eta * 1.15),
        delay_risk: risk,
        cost: Math.round(d * (vehicle === 'Truck' ? 18 : vehicle === 'Van' ? 12 : 7)),
        assigned_driver: 'Driver 1',
        analysis: 'Route optimized based on current traffic and weather conditions.',
      })
      const fallbackEta = Math.round((Number(form.distance) / 60) * 60)
      setScheduledTime(getScheduledDelivery(fallbackEta))
      setMapShipment({
        id: 'PREVIEW',
        source: form.source, destination: form.destination,
        distance: d, weight: w,
        priority: form.priority, eta, delay_risk: risk,
        vehicle, route: `Route A`, status: 'in_transit',
        assigned_driver: 'D1', ai_analysis: 'Route optimized based on current conditions.',
      })
    }
    setPlanLoading(false)
  }

  async function handleSave() {
    if (!aiPlan) return
    setSaveLoading(true)
    const shipmentData: Omit<Shipment, 'id' | 'createdAt'> = {
      source: form.source, destination: form.destination,
      distance: Number(form.distance), weight: Number(form.weight),
      priority: form.priority, eta: aiPlan.eta, delay_risk: aiPlan.delay_risk,
      vehicle: aiPlan.vehicle, route: aiPlan.route, status: 'pending',
      assigned_driver: aiPlan.assigned_driver.replace('Driver ', 'D'),
      ai_analysis: aiPlan.analysis,
    }
    try {
      await createShipment(shipmentData)
    } catch {
      setShipments(prev => [{ ...shipmentData, id: `S${prev.length + 1}` }, ...prev])
    }
    setSaved(true)
    setSaveLoading(false)
    setForm(INITIAL_FORM)
    setAiPlan(null)
    setTimeout(() => setSaved(false), 3000)
  }

  const totalCost = shipments.reduce((sum, s) => sum + (Math.round((s.distance || 200) * 12)), 0)
  const autoPlanned = shipments.filter(s => s.ai_analysis).length

  return (
    <div className="min-h-screen flex">
      <div className={`flex-1 min-w-0 transition-all duration-300`}>
        <div className="max-w-[1400px] mx-auto px-6 py-7">

          {/* Header */}
          <div className="flex items-start justify-between mb-7">
            <div>
              <h1 className="text-4xl font-bold text-[#111111] leading-tight">Operator<br />Control Panel</h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-zinc-500 text-sm">Create shipments and trigger AI routing</p>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${liveData ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-500'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${liveData ? 'bg-green-500 animate-pulse' : 'bg-zinc-400'}`} />
                  {liveData ? 'Firebase Live' : 'Demo data'}
                </span>
              </div>
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

            <div className="flex items-center gap-6">
              <div className="text-center"><div className="text-3xl font-bold text-[#111111]">{shipments.length}</div><div className="text-xs text-zinc-400">Total</div></div>
              <div className="text-center"><div className="text-3xl font-bold text-[#111111]">{autoPlanned}</div><div className="text-xs text-zinc-400">AI Planned</div></div>
              <div className="text-center"><div className="text-3xl font-bold text-brand-yellow">₹{(totalCost / 1000).toFixed(0)}K</div><div className="text-xs text-zinc-400">Est. Cost</div></div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-5">

            {/* ── FORM ── */}
            <div className="col-span-4 card">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 bg-[#111111] rounded-lg flex items-center justify-center"><Plus size={14} className="text-white" /></div>
                <h2 className="font-bold text-[#111111]">New Shipment</h2>
              </div>
              <div className="space-y-3">
                {[
                  { key: 'source', label: 'Source City', placeholder: 'e.g. Bangalore' },
                  { key: 'destination', label: 'Destination City', placeholder: 'e.g. Chennai' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs font-semibold text-zinc-500 mb-1 block uppercase tracking-wide">{f.label}</label>
                    <input type="text" placeholder={f.placeholder}
                      value={form[f.key as keyof FormData]}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow" />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'distance', label: 'Distance (km)', placeholder: '350' },
                    { key: 'weight', label: 'Weight (kg)', placeholder: '50' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="text-xs font-semibold text-zinc-500 mb-1 block uppercase tracking-wide">{f.label}</label>
                      <input type="number" placeholder={f.placeholder}
                        value={form[f.key as keyof FormData]}
                        onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                        className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow" />
                    </div>
                  ))}
                </div>

                {/* Priority */}
                <div>
                  <label className="text-xs font-semibold text-zinc-500 mb-1 block uppercase tracking-wide">Priority</label>
                  <div className="relative">
                    <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value as FormData['priority'] }))}
                      className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-brand-yellow">
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                  </div>
                </div>

                {/* Traffic + Weather */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-zinc-500 mb-1 flex items-center gap-1 uppercase tracking-wide">
                      <Wind size={11} /> Traffic
                    </label>
                    <div className="relative">
                      <select value={form.traffic} onChange={e => setForm(p => ({ ...p, traffic: e.target.value as FormData['traffic'] }))}
                        className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-brand-yellow">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                      <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-zinc-500 mb-1 flex items-center gap-1 uppercase tracking-wide">
                      <CloudRain size={11} /> Weather
                    </label>
                    <div className="relative">
                      <select value={form.weather} onChange={e => setForm(p => ({ ...p, weather: e.target.value as FormData['weather'] }))}
                        className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-brand-yellow">
                        <option value="clear">Clear</option>
                        <option value="rain">Rain</option>
                        <option value="storm">Storm</option>
                      </select>
                      <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Live conditions badge */}
                <div className="flex items-center justify-between px-3 py-2 bg-zinc-50 rounded-xl border border-zinc-100">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: TRAFFIC_META[form.traffic].color }} />
                      <span className="text-xs text-zinc-500">
                        Traffic: <strong className="text-zinc-700">{TRAFFIC_META[form.traffic].label}</strong>
                      </span>
                    </div>
                    <span className="text-zinc-300">·</span>
                    <span className="text-xs text-zinc-500">
                      {WEATHER_META[form.weather].emoji} <strong className="text-zinc-700">{WEATHER_META[form.weather].label}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={refreshConditions}
                    title="Refresh live conditions"
                    className="text-zinc-400 hover:text-brand-yellow transition-colors"
                  >
                    <RefreshCw size={13} />
                  </button>
                </div>
              </div>

              {/* Pet Mode toggle */}
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => { setPetMode(p => !p); setPetPlan(null) }}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 font-semibold text-sm transition-all ${petMode ? 'border-orange-400 bg-orange-50 text-orange-600' : 'border-zinc-200 text-zinc-500 hover:border-orange-300 hover:text-orange-500'}`}
                >
                  <PawPrint size={15} />
                  {petMode ? '🐾 Pet Mode ON — Extra safety checks active' : 'Enable Pet Transport Mode'}
                </button>
              </div>

              {/* Pet fields (shown when pet mode is on) */}
              {petMode && (
                <div className="mt-3 p-3 bg-orange-50 border border-orange-100 rounded-xl space-y-3">
                  <div className="text-xs font-semibold text-orange-600 uppercase tracking-wide flex items-center gap-1">
                    <PawPrint size={10} /> Pet Details
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {(['dog', 'cat'] as const).map(pt => (
                      <button key={pt} type="button"
                        onClick={() => setPetType(pt)}
                        className={`rounded-lg py-2 text-sm font-semibold border-2 transition-all ${petType === pt ? 'border-orange-400 bg-orange-100 text-orange-700' : 'border-zinc-200 bg-white text-zinc-500'}`}>
                        {pt === 'dog' ? '🐕 Dog' : '🐈 Cat'}
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-zinc-500 mb-1 block uppercase tracking-wide">Pet Age (years)</label>
                    <input type="number" placeholder="e.g. 3" value={petAge} onChange={e => setPetAge(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                  </div>
                </div>
              )}

              <button onClick={handleAIPlan} disabled={planLoading}
                className="w-full mt-3 flex items-center justify-center gap-2 bg-brand-yellow text-black font-bold py-3 rounded-xl hover:bg-yellow-400 transition-all disabled:opacity-60">
                {planLoading ? <><Loader2 size={16} className="animate-spin" />AI Planning…</> : <><Sparkles size={16} />{petMode ? 'AI Plan + Pet Safety' : 'AI Plan Route'}</>}
              </button>
            </div>

            {/* ── AI RESULT ── */}
            <div className="col-span-4 card">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-brand-yellow rounded-lg flex items-center justify-center"><Sparkles size={14} className="text-black" /></div>
                <h2 className="font-bold text-[#111111]">AI Planning Result</h2>
              </div>

              {!aiPlan && !planLoading && (
                <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                  <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center">
                    <Sparkles size={24} className="text-zinc-300" />
                  </div>
                  <p className="text-zinc-400 text-sm">Fill the form and click<br /><strong className="text-zinc-600">AI Plan Route</strong></p>
                </div>
              )}

              {planLoading && (
                <div className="flex flex-col items-center justify-center gap-4 py-10">
                  <div className="relative w-16 h-16">
                    <div className="w-16 h-16 border-2 border-brand-yellow/30 rounded-full" />
                    <div className="absolute inset-0 w-16 h-16 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin" />
                    <Sparkles size={18} className="absolute inset-0 m-auto text-brand-yellow" />
                  </div>
                  <p className="text-sm font-semibold text-[#111111]">AI planning route…</p>
                  <p className="text-xs text-zinc-400">Analyzing traffic, weather, capacity</p>
                </div>
              )}

              {aiPlan && !planLoading && (
                <div className="space-y-3">
                  {/* ETA + Vehicle + Cost */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-zinc-50 rounded-xl p-3 text-center">
                      <Clock size={14} className="text-brand-yellow mx-auto mb-1" />
                      <div className="text-xl font-bold text-[#111111]">{aiPlan.eta}</div>
                      <div className="text-xs text-zinc-400">mins ETA</div>
                    </div>
                    <div className="bg-zinc-50 rounded-xl p-3 text-center">
                      <Truck size={14} className="text-brand-yellow mx-auto mb-1" />
                      <div className="text-sm font-bold text-[#111111]">{aiPlan.vehicle}</div>
                      <div className="text-xs text-zinc-400">Vehicle</div>
                    </div>
                    <div className="bg-brand-yellow/10 rounded-xl p-3 text-center border border-brand-yellow/20">
                      <IndianRupee size={14} className="text-brand-yellow mx-auto mb-1" />
                      <div className="text-sm font-bold text-[#111111]">₹{aiPlan.cost.toLocaleString()}</div>
                      <div className="text-xs text-zinc-400">Est. Cost</div>
                    </div>
                  </div>

                  {/* Scheduled delivery time */}
                  {scheduledTime && (
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-zinc-50 rounded-xl border border-zinc-100">
                      <CalendarClock size={14} className="text-zinc-500 shrink-0" />
                      <span className="text-xs text-zinc-500">Scheduled delivery: <strong className="text-zinc-800">{scheduledTime}</strong></span>
                    </div>
                  )}

                  {/* Route comparison */}
                  <div className="bg-zinc-50 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Route size={13} className="text-zinc-400" />
                      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Route Comparison</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                        <div>
                          <div className="text-xs font-bold text-green-800">{aiPlan.route}</div>
                          <div className="text-[10px] text-green-600">{aiPlan.route_eta} mins</div>
                        </div>
                        <span className="text-[10px] bg-green-500 text-white font-bold px-2 py-0.5 rounded-full">✓ Selected</span>
                      </div>
                      <div className="flex items-center justify-between bg-zinc-100 rounded-lg px-3 py-2">
                        <div>
                          <div className="text-xs font-semibold text-zinc-600">{aiPlan.alternate_route}</div>
                          <div className="text-[10px] text-zinc-400">{aiPlan.alternate_route_eta} mins</div>
                        </div>
                        <span className="text-[10px] text-zinc-400 font-medium">+{aiPlan.alternate_route_eta - aiPlan.route_eta} mins</span>
                      </div>
                    </div>
                  </div>

                  {/* Delay risk */}
                  <div className={`rounded-xl p-3 border ${riskColorMap[aiPlan.delay_risk]}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Delay Risk</span>
                      <RiskBadge risk={aiPlan.delay_risk} />
                    </div>
                  </div>

                  {/* Auto assignment */}
                  <div className="bg-[#111111] rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Zap size={12} className="text-brand-yellow" />
                      <span className="text-xs font-semibold text-brand-yellow uppercase tracking-wide">Auto Assigned</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck size={13} className="text-zinc-400" />
                        <span className="text-xs text-zinc-300">Vehicle: <strong className="text-white">{aiPlan.vehicle}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User size={13} className="text-zinc-400" />
                        <span className="text-xs text-zinc-300"><strong className="text-white">{aiPlan.assigned_driver}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* AI analysis */}
                  <div className="bg-brand-yellow/10 border border-brand-yellow/20 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Sparkles size={12} className="text-brand-yellow" />
                      <span className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">AI Analysis</span>
                    </div>
                    <p className="text-xs text-zinc-700 leading-relaxed">{aiPlan.analysis}</p>
                  </div>

                  <button onClick={handleSave} disabled={saveLoading || saved}
                    className="w-full flex items-center justify-center gap-2 bg-[#111111] text-white font-bold py-3 rounded-xl hover:bg-zinc-800 transition-all disabled:opacity-60">
                    {saveLoading ? <><Loader2 size={15} className="animate-spin" />Saving…</>
                      : saved ? <><CheckCircle size={15} className="text-green-400" />Saved to Firebase!</>
                      : <><Send size={15} />Save Shipment</>}
                  </button>
                </div>
              )}
            </div>

            {/* ── RECENT SHIPMENTS ── */}
            <div className="col-span-4 card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-[#111111]">Recent Shipments</h2>
                <Package size={15} className="text-zinc-400" />
              </div>
              <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                {shipments.map(s => (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 hover:bg-zinc-100 transition-all">
                    <div className="w-8 h-8 bg-brand-yellow/20 rounded-lg flex items-center justify-center shrink-0">
                      <Package size={13} className="text-brand-yellow-dark" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-[#111111]">{s.id}</span>
                        <StatusBadge status={s.status} />
                      </div>
                      <div className="text-xs text-zinc-500 truncate mt-0.5">{s.source} → {s.destination}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-zinc-400">{s.eta} min</span>
                        <span className="text-xs text-zinc-400">· ₹{Math.round((s.distance || 200) * 12).toLocaleString()}</span>
                        <RiskBadge risk={s.delay_risk} size="sm" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── ROUTE MAP ── */}
            <div className="col-span-12 card !p-0 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100">
                <div>
                  <h2 className="font-bold text-[#111111]">Route Map</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">Primary route · Alternate route · Live truck position · Reroute approval</p>
                </div>
                {mapShipment && (
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span className="font-mono bg-zinc-100 px-2 py-0.5 rounded text-zinc-700">{mapShipment.source} → {mapShipment.destination}</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <OperatorMap shipment={mapShipment} />
              </div>
            </div>

            {/* ── CAMERA VISUAL INTELLIGENCE ── */}
            <div className="col-span-12 card !p-0 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100">
                <div>
                  <h2 className="font-bold text-[#111111]">Camera Visual Intelligence</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">AI-powered video analysis · Real-time detection · Auto reroute</p>
                </div>
                <span className="text-xs bg-purple-50 text-purple-600 font-bold px-2 py-0.5 rounded-full">AI Vision</span>
              </div>
              <div className="p-4">
                <VisualIntelligence
                  source={mapShipment?.source ?? 'Bangalore'}
                  destination={mapShipment?.destination ?? 'Chennai'}
                />
              </div>
            </div>

            {/* ── DATA PIPELINE STATUS ── */}
            <div className="col-span-12 card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-[#111111] rounded-lg flex items-center justify-center"><Server size={13} className="text-white" /></div>
                  <h2 className="font-bold text-[#111111]">Data Pipeline</h2>
                </div>
                <span className="text-xs text-zinc-400">Section 3.1 — Data Collection &amp; Integration</span>
              </div>
              <div className="grid grid-cols-5 gap-3">
                {[
                  { icon: <BarChart2 size={15} className="text-blue-500" />, label: 'Historical Dataset', value: '20 records', sub: 'data/shipments.json', color: 'bg-blue-50 border-blue-100' },
                  { icon: <Wifi size={15} className="text-yellow-500" />, label: 'Live Traffic Feed', value: liveData ? 'Firebase' : 'Simulated', sub: 'lib/realtime.ts · getTraffic()', color: 'bg-yellow-50 border-yellow-100' },
                  { icon: <CloudRain size={15} className="text-sky-500" />, label: 'Weather Conditions', value: WEATHER_META[form.weather].label, sub: `lib/realtime.ts · ${WEATHER_META[form.weather].emoji}`, color: 'bg-sky-50 border-sky-100' },
                  { icon: <Database size={15} className="text-green-500" />, label: 'Firebase Firestore', value: liveData ? 'Connected' : 'Demo Mode', sub: 'Real-time snapshot listener', color: liveData ? 'bg-green-50 border-green-100' : 'bg-zinc-50 border-zinc-100' },
                  { icon: <Brain size={15} className="text-purple-500" />, label: 'Claude AI Engine', value: 'claude-haiku-4-5', sub: 'Historical context injected', color: 'bg-purple-50 border-purple-100' },
                ].map((src, i) => (
                  <div key={i} className={`rounded-xl p-3 border ${src.color} flex items-start gap-2.5`}>
                    <div className="mt-0.5 shrink-0">{src.icon}</div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-zinc-700 truncate">{src.label}</div>
                      <div className="text-sm font-bold text-[#111111] mt-0.5">{src.value}</div>
                      <div className="text-[10px] text-zinc-400 truncate mt-0.5">{src.sub}</div>
                    </div>
                    <div className="ml-auto shrink-0 w-1.5 h-1.5 rounded-full bg-green-400 mt-1" />
                  </div>
                ))}
              </div>
            </div>

            {/* ── FULL TABLE ── */}
            <div className="col-span-12 card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-[#111111]">All Shipments</h2>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <Zap size={13} className="text-brand-yellow" />
                  {autoPlanned} of {shipments.length} AI-planned · 0 manual interventions
                </div>
              </div>
              <ShipmentTable shipments={shipments} onApproveQuote={handleApproveQuote} />
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default function OperatorPage() {
  return (
    <AuthGuard requiredRole="operator">
      <OperatorContent />
    </AuthGuard>
  )
}
