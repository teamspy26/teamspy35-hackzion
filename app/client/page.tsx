'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import AuthGuard from '@/components/AuthGuard'
import Sidebar from '@/components/Sidebar'
import ClientTracker from '@/components/ClientTracker'
import { createShipment } from '@/lib/firestore'
import NegotiationBox from '@/components/NegotiationBox'
import { CITY_COORDS, ANIMAL_CATEGORIES } from '@/lib/mapData'
import {
  PawPrint, Thermometer, AlertTriangle, CheckCircle, Sparkles,
  Send, Loader2, MapPin, Route, Shield, Navigation, Droplets, Wind,
  Train, Truck, Plane, Zap, Package, LogOut
} from 'lucide-react'
import ClientMap from '@/components/maps/ClientMap'

interface PetPlan {
  comfort_score: number
  risk: 'LOW' | 'MEDIUM' | 'HIGH'
  heat_risk: 'LOW' | 'MEDIUM' | 'HIGH'
  safe_mode: 'Truck' | 'Train' | 'Air'
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

const RISK_CONFIG: Record<string, any> = {
  LOW:    { color: 'text-green-600',  bg: 'bg-green-50  border-green-200',  bar: 'bg-green-500',  label: 'Low Risk'    },
  MEDIUM: { color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200', bar: 'bg-yellow-500', label: 'Medium Risk' },
  HIGH:   { color: 'text-red-600',    bg: 'bg-red-50    border-red-200',    bar: 'bg-red-500',    label: 'High Risk'   },
}

const MODE_ICON: Record<string, React.ReactNode> = {
  Train: <Train size={16} />,
  Truck: <Truck size={16} />,
  Air:   <Plane size={16} />,
}

function ComfortGauge({ score }: { score: number }) {
  const r = 40
  const circ = 2 * Math.PI * r
  const filled = (score / 100) * circ
  const color = score >= 70 ? '#22c55e' : score >= 45 ? '#eab308' : '#ef4444'
  const label = score >= 70 ? 'Good' : score >= 45 ? 'Fair' : 'Poor'

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#f4f4f5" strokeWidth="10" />
        <circle
          cx="50" cy="50" r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={`${filled} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
        <text x="50" y="45" textAnchor="middle" fontSize="22" fontWeight="bold" fill="#111111">{score}</text>
        <text x="50" y="62" textAnchor="middle" fontSize="10" fill="#71717a">/100</text>
      </svg>
      <span className="text-xs font-bold" style={{ color }}>{label}</span>
    </div>
  )
}

function ClientContent() {
  const { logout } = useAuth()
  
  // Shared States
  const [activeSection, setActiveSection] = useState('pet')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [source, setSource]       = useState('')
  const [destination, setDest]    = useState('')
  const [distance, setDistance]   = useState('')
  const [weight, setWeight]       = useState('')
  
  const [loading, setLoading]     = useState(false)
  const [saved, setSaved]         = useState(false)
  const [saving, setSaving]       = useState(false)

  // Pet Specific States
  const [petCategory, setPetCategory] = useState(Object.keys(ANIMAL_CATEGORIES)[0])
  const [petType, setPetType]     = useState<string>('dog')
  const [age, setAge]             = useState('')
  const [temperature, setTemp]    = useState('35')
  const [petPlan, setPetPlan]     = useState<PetPlan | null>(null)

  useEffect(() => {
    async function fetchTemp() {
      if (!source || !CITY_COORDS[source]) return
      try {
        const { lat, lng } = CITY_COORDS[source]
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`)
        if (res.ok) {
          const data = await res.json()
          if (data?.current_weather?.temperature) {
            setTemp(data.current_weather.temperature.toString())
          }
        }
      } catch (e) {
        console.error('Weather fetch error', e)
      }
    }
    fetchTemp()
  }, [source])

  // Freight Specific States
  const [cargoType, setCargoType] = useState('Standard')
  const [priority, setPriority]   = useState('medium')
  const [freightPlan, setFreightPlan] = useState<AIPlan | null>(null)

  async function handlePetCheck() {
    if (!source || !destination || !distance || !weight || !age) {
      alert('Please fill all fields')
      return
    }
    setLoading(true)
    setPetPlan(null)
    setSaved(false)
    try {
      const res = await fetch('/api/pet-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pet_type: petType,
          weight: Number(weight),
          age: Number(age),
          source, destination,
          distance: Number(distance),
          temperature: Number(temperature),
        }),
      })
      const json = await res.json()
      setPetPlan(json.data)
    } catch {
      alert('Failed to analyze. Please try again.')
    }
    setLoading(false)
  }

  async function handlePetBookWithNegotiation(finalPrice: number) {
    if (!petPlan) return
    setSaving(true)
    try {
      await createShipment({
        source, destination,
        distance: Number(distance),
        weight: Number(weight),
        priority: 'high',
        eta: petPlan.eta_minutes,
        delay_risk: petPlan.risk.toLowerCase() as 'low' | 'medium' | 'high',
        vehicle: petPlan.safe_mode,
        route: `Pet Transport — ${petPlan.safe_mode}`,
        status: 'quote_pending',
        negotiated_price: finalPrice,
        assigned_driver: 'D1',
        ai_analysis: petPlan.analysis,
        pet_type: petType,
        pet_weight: Number(weight),
        pet_age: Number(age),
        pet_comfort_score: petPlan.comfort_score,
        pet_risk: petPlan.risk,
        pet_safe_mode: petPlan.safe_mode,
        pet_rest_stops: petPlan.rest_stops.map(s => s.location),
      })
    } catch {
      // fallback
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 6000)
  }
  
  async function handlePetBookDirect() {
    if (!petPlan) return
    setSaving(true)
    try {
      await createShipment({
        source, destination,
        distance: Number(distance),
        weight: Number(weight),
        priority: 'high',
        eta: petPlan.eta_minutes,
        delay_risk: petPlan.risk.toLowerCase() as 'low' | 'medium' | 'high',
        vehicle: petPlan.safe_mode,
        route: `Pet Transport — ${petPlan.safe_mode}`,
        status: 'pending',
        assigned_driver: 'D1',
        ai_analysis: petPlan.analysis,
        pet_type: petType,
        pet_weight: Number(weight),
        pet_age: Number(age),
        pet_comfort_score: petPlan.comfort_score,
        pet_risk: petPlan.risk,
        pet_safe_mode: petPlan.safe_mode,
        pet_rest_stops: petPlan.rest_stops.map(s => s.location),
      })
    } catch {}
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function handleFreightCheck() {
    if (!source || !destination || !distance || !weight) {
      alert('Please fill all freight fields')
      return
    }
    setLoading(true)
    setFreightPlan(null)
    setSaved(false)
    try {
      const res = await fetch('/api/ai-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source,
          destination,
          distance: Number(distance),
          weight: Number(weight),
          priority,
        }),
      })
      const json = await res.json()
      setFreightPlan(json.data)
    } catch {
      alert('Failed to analyze. Please try again.')
    }
    setLoading(false)
  }

  async function handleFreightBookWithNegotiation(finalPrice: number) {
    if (!freightPlan) return
    setSaving(true)
    try {
      await createShipment({
        source, destination,
        distance: Number(distance),
        weight: Number(weight),
        priority: priority as any,
        eta: freightPlan.eta,
        delay_risk: freightPlan.delay_risk,
        vehicle: freightPlan.vehicle,
        route: freightPlan.route,
        status: 'quote_pending',
        negotiated_price: finalPrice,
        assigned_driver: freightPlan.assigned_driver,
        ai_analysis: freightPlan.analysis,
        cargo_type: cargoType,
      })
    } catch {
      // fallback
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 6000)
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} onCollapse={setSidebarCollapsed} />
      <div className={`flex-1 min-w-0 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-60'}`}>
        <div className="max-w-[1400px] mx-auto px-6 py-7">

          {activeSection === 'track' ? (
            <div className="h-[calc(100vh-100px)]">
              <ClientTracker />
            </div>
          ) : activeSection === 'pet' ? (
            <>
              {/* Pet Header */}
              <div className="flex items-start justify-between mb-7">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-3xl">🐾</span>
                    <h1 className="text-4xl font-bold text-[#111111] leading-tight">Pet Transport<br />Safety Module</h1>
                  </div>
                  <p className="text-zinc-500 text-sm ml-10">AI-powered comfort scoring, heat risk detection & smart rest stop planning</p>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-5">
                {/* ── PET FORM ── */}
                <div className="col-span-4 flex flex-col gap-4">
                  <div className="card">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center"><PawPrint size={14} className="text-white" /></div>
                      <h2 className="font-bold text-[#111111]">Pet Details</h2>
                    </div>

                    <div className="mb-4 space-y-3">
                      <div>
                         <label className="text-xs font-semibold text-zinc-500 mb-1 block uppercase tracking-wide">Category</label>
                         <select value={petCategory} onChange={e => { setPetCategory(e.target.value); setPetType(ANIMAL_CATEGORIES[e.target.value][0].value) }} className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow">
                           {Object.keys(ANIMAL_CATEGORIES).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                         </select>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                         {ANIMAL_CATEGORIES[petCategory].map(p => (
                            <button key={p.value} type="button"
                              onClick={() => setPetType(p.value)}
                              className={`rounded-lg p-2 border-2 text-center transition-all ${petType === p.value ? 'border-brand-yellow bg-brand-yellow/10' : 'border-zinc-200 hover:border-zinc-300'}`}>
                              <div className="text-2xl mb-1">{p.emoji}</div>
                              <div className="font-bold text-[11px] text-[#111111] leading-tight">{p.label}</div>
                            </button>
                         ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-zinc-500 mb-1 block uppercase tracking-wide">Weight (kg)</label>
                        <input type="number" placeholder="e.g. 12" value={weight} onChange={e => setWeight(e.target.value)}
                          className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-zinc-500 mb-1 block uppercase tracking-wide">Age (years)</label>
                        <input type="number" placeholder="e.g. 3" value={age} onChange={e => setAge(e.target.value)}
                          className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow" />
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 bg-[#111111] rounded-lg flex items-center justify-center"><Route size={14} className="text-white" /></div>
                      <h2 className="font-bold text-[#111111]">Route Details</h2>
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: 'Origin City', placeholder: 'e.g. Bangalore', val: source, set: setSource },
                        { label: 'Destination City', placeholder: 'e.g. Chennai', val: destination, set: setDest },
                      ].map(f => (
                        <div key={f.label}>
                          <label className="text-xs font-semibold text-zinc-500 mb-1 block uppercase tracking-wide">{f.label}</label>
                          <input type="text" placeholder={f.placeholder} value={f.val} onChange={e => f.set(e.target.value)}
                            className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow" />
                        </div>
                      ))}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-zinc-500 mb-1 block uppercase tracking-wide">Distance (km)</label>
                          <input type="number" placeholder="350" value={distance} onChange={e => setDistance(e.target.value)}
                            className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-zinc-500 mb-1 flex items-center gap-1 uppercase tracking-wide">
                            <Thermometer size={10} /> Temp (°C)
                          </label>
                          <input type="number" placeholder="35" value={temperature} onChange={e => setTemp(e.target.value)}
                            className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow" />
                        </div>
                      </div>
                    </div>
                    <button onClick={handlePetCheck} disabled={loading}
                      className="w-full mt-4 flex items-center justify-center gap-2 bg-orange-500 text-white font-bold py-3 rounded-xl hover:bg-orange-400 transition-all disabled:opacity-60">
                      {loading ? <><Loader2 size={16} className="animate-spin" />Analyzing…</> : <><Sparkles size={16} />Check Pet Safety</>}
                    </button>
                  </div>
                </div>

                {/* ── PET SAFETY RESULT ── */}
                <div className="col-span-4 card">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center"><Shield size={14} className="text-white" /></div>
                    <h2 className="font-bold text-[#111111]">Pet Safety Analysis</h2>
                  </div>

                  {!petPlan && !loading && (
                    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                      <div className="text-5xl">🐾</div>
                      <p className="text-zinc-400 text-sm">Fill pet & route details<br />then click <strong className="text-zinc-600">Check Pet Safety</strong></p>
                    </div>
                  )}

                  {loading && (
                    <div className="flex flex-col items-center justify-center gap-4 py-12">
                      <div className="relative w-16 h-16">
                        <div className="w-16 h-16 border-2 border-orange-200 rounded-full" />
                        <div className="absolute inset-0 w-16 h-16 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                      <p className="text-sm font-semibold text-[#111111]">AI analyzing pet safety…</p>
                    </div>
                  )}

                  {petPlan && !loading && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-4 bg-zinc-50 rounded-xl p-4">
                        <ComfortGauge score={petPlan.comfort_score} />
                        <div className="flex-1">
                          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">Comfort Score</div>
                          <div className="text-2xl font-extrabold text-[#111111] mb-2">{petPlan.comfort_score}<span className="text-sm font-normal text-zinc-400"> / 100</span></div>
                          <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${RISK_CONFIG[petPlan.risk].bg} ${RISK_CONFIG[petPlan.risk].color}`}>
                            <Shield size={11} /> {RISK_CONFIG[petPlan.risk].label}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 bg-[#111111] rounded-xl p-3">
                        <div className="w-9 h-9 bg-brand-yellow rounded-lg flex items-center justify-center shrink-0 text-black">
                          {MODE_ICON[petPlan.safe_mode]}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <Zap size={11} className="text-brand-yellow" />
                            <span className="text-xs font-semibold text-brand-yellow uppercase tracking-wide">Recommended Mode</span>
                          </div>
                          <div className="font-bold text-white text-sm">{petPlan.safe_mode}</div>
                          <div className="text-[10px] text-zinc-400 mt-0.5">{petPlan.safe_mode_reason}</div>
                        </div>
                      </div>

                      <div className="bg-orange-50 border border-orange-100 rounded-xl p-3">
                        <p className="text-xs text-zinc-700 leading-relaxed">{petPlan.analysis}</p>
                      </div>

                      <button onClick={handlePetBookDirect} disabled={saving || saved}
                        className="w-full flex items-center justify-center gap-2 bg-[#111111] text-white font-bold py-3 rounded-xl hover:bg-zinc-800 transition-all disabled:opacity-60">
                        {saving ? <><Loader2 size={15} className="animate-spin" />Booking…</>
                          : saved ? <><CheckCircle size={15} className="text-green-400" />Transport Booked!</>
                          : <><Send size={15} />Book Pet Transport</>}
                      </button>
                    </div>
                  )}
                </div>

                {/* ── RECOMMENDATIONS ── */}
                <div className="col-span-4 flex flex-col gap-4">
                  <div className="card">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center"><MapPin size={14} className="text-white" /></div>
                      <h2 className="font-bold text-[#111111]">Smart Rest Stops</h2>
                    </div>

                    {!petPlan ? (
                      <div className="py-6 text-center text-xs text-zinc-400">Run analysis to see rest stop plan</div>
                    ) : (
                      <div className="space-y-3">
                        {petPlan.rest_stops.map((stop) => (
                          <div key={stop.stop} className="flex items-start gap-3">
                            <div className="w-7 h-7 bg-brand-yellow rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold">{stop.stop}</div>
                            <div className="flex-1 bg-zinc-50 rounded-xl p-2.5">
                              <span className="text-xs font-bold text-[#111111]">{stop.location}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── NEGOTIATION BOX ── */}
                <div className="col-span-12 mt-2 mb-2">
                  {(!petPlan || !source || !destination || !distance || !weight) ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
                      <div className="text-4xl text-zinc-300">💬</div>
                      <h3 className="font-bold text-zinc-600">AI Sales Negotiator</h3>
                    </div>
                  ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <NegotiationBox
                         source={source}
                         destination={destination}
                         weight={Number(weight)}
                         baseCost={Math.round(Number(distance) * (Number(weight) > 50 ? 15 : 8))}
                         onAgreeDeal={(price) => handlePetBookWithNegotiation(price)}
                      />
                    </div>
                  )}
                </div>

                {/* ── SHIPMENT TRACKING MAP ── */}
                {petPlan && source && destination && (
                  <div className="col-span-12 card !p-0 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100">
                      <div>
                        <h2 className="font-bold text-[#111111]">Live Shipment Tracking</h2>
                      </div>
                    </div>
                    <div className="p-4">
                      <ClientMap shipment={{
                        id: 'PET-TRACK',
                        source, destination,
                        distance: Number(distance),
                        weight: Number(weight),
                        priority: 'high',
                        eta: petPlan.eta_minutes,
                        delay_risk: petPlan.risk.toLowerCase() as 'low' | 'medium' | 'high',
                        vehicle: petPlan.safe_mode,
                        route: `Pet Transport — ${petPlan.safe_mode}`,
                        status: 'in_transit',
                        assigned_driver: 'D1',
                        ai_analysis: petPlan.analysis,
                      }} />
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-5">
              {/* Freight Header */}
              <div className="flex items-start justify-between mb-7">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-3xl">📦</span>
                    <h1 className="text-4xl font-bold text-[#111111] leading-tight">General Freight<br />AI Planner</h1>
                  </div>
                  <p className="text-zinc-500 text-sm ml-10">AI-optimized routes, smart cost estimates & dynamic capacity</p>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-5">
                {/* ── FREIGHT FORM ── */}
                <div className="col-span-4 flex flex-col gap-4">
                  <div className="card">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center"><Package size={14} className="text-white" /></div>
                      <h2 className="font-bold text-[#111111]">Cargo Details</h2>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-zinc-500 mb-1 block uppercase tracking-wide">Origin City</label>
                        <input type="text" placeholder="e.g. Mumbai" value={source} onChange={e => setSource(e.target.value)}
                          className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-zinc-500 mb-1 block uppercase tracking-wide">Destination City</label>
                        <input type="text" placeholder="e.g. Pune" value={destination} onChange={e => setDest(e.target.value)}
                          className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-zinc-500 mb-1 block uppercase tracking-wide">Distance (km)</label>
                          <input type="number" placeholder="150" value={distance} onChange={e => setDistance(e.target.value)}
                            className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-zinc-500 mb-1 block uppercase tracking-wide">Weight (kg)</label>
                          <input type="number" placeholder="1000" value={weight} onChange={e => setWeight(e.target.value)}
                            className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-zinc-500 mb-1 block uppercase tracking-wide">Cargo Type</label>
                          <select value={cargoType} onChange={e => setCargoType(e.target.value)}
                            className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow">
                            <option value="Standard">Standard</option>
                            <option value="Pallets">Pallets</option>
                            <option value="Fragile">Fragile</option>
                            <option value="Hazmat">Hazmat</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-zinc-500 mb-1 block uppercase tracking-wide">Priority</label>
                          <select value={priority} onChange={e => setPriority(e.target.value)}
                            className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow">
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <button onClick={handleFreightCheck} disabled={loading}
                      className="w-full mt-4 flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-500 transition-all disabled:opacity-60">
                      {loading ? <><Loader2 size={16} className="animate-spin" />Analyzing…</> : <><Sparkles size={16} />Generate AI Plan</>}
                    </button>
                  </div>
                </div>

                {/* ── FREIGHT AI PLAN RESULT ── */}
                <div className="col-span-8">
                  <div className="card h-full">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center"><Navigation size={14} className="text-white" /></div>
                      <h2 className="font-bold text-[#111111]">AI Analysis & Routing</h2>
                    </div>
                    {!freightPlan && !loading && (
                      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                        <div className="text-5xl">🤖</div>
                        <p className="text-zinc-400 text-sm">Enter cargo details & click <strong className="text-zinc-600">Generate AI Plan</strong><br/>to calculate optimal routes and costs.</p>
                      </div>
                    )}
                    {loading && (
                      <div className="flex flex-col items-center justify-center gap-4 py-16">
                        <div className="relative w-16 h-16 text-blue-500">
                          <Loader2 size={64} className="animate-spin" />
                        </div>
                        <p className="text-sm font-semibold text-[#111111]">Computing logicistics constraints…</p>
                      </div>
                    )}
                    {freightPlan && !loading && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-zinc-50 p-4 rounded-xl space-y-3">
                          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Route</p>
                          <div className="font-bold text-[#111111]">{freightPlan.route}</div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-zinc-500">ETA</span>
                            <span className="font-bold text-[#111111]">{freightPlan.eta} min</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-zinc-500">Vehicle</span>
                            <span className="font-bold text-[#111111]">{freightPlan.vehicle}</span>
                          </div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-xl flex flex-col justify-between">
                           <div>
                             <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide mb-1">AI Recommendation</p>
                             <p className="text-sm text-blue-900 leading-relaxed">{freightPlan.analysis}</p>
                           </div>
                           <div className="mt-3 text-right">
                             <div className="text-xs text-blue-500 mb-1">Estimated Cost</div>
                             <div className="text-2xl font-black text-blue-700">₹{freightPlan.cost.toLocaleString()}</div>
                           </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── FREIGHT NEGOTIATION BOX ── */}
                <div className="col-span-12 mt-2 mb-2">
                  {(!freightPlan || !source || !destination || !distance || !weight) ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
                      <div className="text-4xl text-zinc-300">💬</div>
                      <h3 className="font-bold text-zinc-600">AI Sales Negotiator</h3>
                      <p className="text-zinc-400 text-sm font-medium">Generate an AI Plan first to negotiate a dynamic rate.</p>
                    </div>
                  ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <NegotiationBox
                         source={source}
                         destination={destination}
                         weight={Number(weight)}
                         baseCost={freightPlan.cost}
                         onAgreeDeal={(price) => handleFreightBookWithNegotiation(price)}
                      />
                    </div>
                  )}
                </div>

                {/* ── FREIGHT TRACKING MAP ── */}
                {freightPlan && source && destination && (
                  <div className="col-span-12 card !p-0 overflow-hidden mt-4 mb-8">
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100">
                      <div>
                        <h2 className="font-bold text-[#111111]">Live Shipment Tracking</h2>
                        <p className="text-xs text-zinc-400 mt-0.5">Route · Estimated arrival · Current position</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-medium text-zinc-600">{source} → {destination}</span>
                        <span className="bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">Planning Phase</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <ClientMap shipment={{
                        id: 'FREIGHT-TRACK',
                        source, destination,
                        distance: Number(distance),
                        weight: Number(weight),
                        priority: priority as any,
                        eta: freightPlan.eta,
                        delay_risk: freightPlan.delay_risk,
                        vehicle: freightPlan.vehicle,
                        route: freightPlan.route,
                        status: 'pending',
                        assigned_driver: freightPlan.assigned_driver,
                        ai_analysis: freightPlan.analysis,
                      }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ClientPage() {
  return (
    <AuthGuard requiredRole="client">
      <ClientContent />
    </AuthGuard>
  )
}
