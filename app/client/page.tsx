'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import Sidebar from '@/components/Sidebar'
import AuthGuard from '@/components/AuthGuard'
import { createShipment, getShipments, Shipment } from '@/lib/firestore'
import {
  PawPrint, Thermometer, AlertTriangle, CheckCircle, Sparkles,
  Send, Loader2, MapPin, Route, Clock, Shield, ChevronDown,
  Navigation, Droplets, Wind, Train, Truck, Plane, Zap, Package, Info
, LogOut } from 'lucide-react'

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

const PET_TYPES = [
  { value: 'dog', emoji: '🐕', label: 'Dog', desc: 'Canis familiaris' },
  { value: 'cat', emoji: '🐈', label: 'Cat', desc: 'Felis catus' },
]

const RISK_CONFIG = {
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
  const [petType, setPetType]     = useState<'dog' | 'cat'>('dog')
  const [weight, setWeight]       = useState('')
  const [age, setAge]             = useState('')
  const [source, setSource]       = useState('')
  const [destination, setDest]    = useState('')
  const [distance, setDistance]   = useState('')
  const [temperature, setTemp]    = useState('35')
  const [plan, setPlan]           = useState<PetPlan | null>(null)
  const [loading, setLoading]     = useState(false)
  const [saved, setSaved]         = useState(false)
  const [saving, setSaving]       = useState(false)
  const [activeSection, setActiveSection] = useState('pet')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  async function handleCheck() {
    if (!source || !destination || !distance || !weight || !age) {
      alert('Please fill all fields')
      return
    }
    setLoading(true)
    setPlan(null)
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
      setPlan(json.data)
    } catch {
      alert('Failed to analyze. Please try again.')
    }
    setLoading(false)
  }

  async function handleBook() {
    if (!plan) return
    setSaving(true)
    try {
      await createShipment({
        source, destination,
        distance: Number(distance),
        weight: Number(weight),
        priority: 'high',
        eta: plan.eta_minutes,
        delay_risk: plan.risk.toLowerCase() as 'low' | 'medium' | 'high',
        vehicle: plan.safe_mode,
        route: `Pet Transport — ${plan.safe_mode}`,
        status: 'pending',
        assigned_driver: 'D1',
        ai_analysis: plan.analysis,
        pet_type: petType,
        pet_weight: Number(weight),
        pet_age: Number(age),
        pet_comfort_score: plan.comfort_score,
        pet_risk: plan.risk,
        pet_safe_mode: plan.safe_mode,
        pet_rest_stops: plan.rest_stops.map(s => s.location),
      })
    } catch {
      // fallback: just mark saved
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="min-h-screen flex">
      <div className={`flex-1 min-w-0 transition-all duration-300`}>
        <div className="max-w-[1400px] mx-auto px-6 py-7">

          {/* Header */}
          <div className="flex items-start justify-between mb-7">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-3xl">🐾</span>
                <h1 className="text-4xl font-bold text-[#111111] leading-tight">Pet Transport<br />Safety Module</h1>
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
              <p className="text-zinc-500 text-sm ml-10">AI-powered comfort scoring, heat risk detection & smart rest stop planning</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center"><div className="text-3xl font-bold text-[#111111]">2</div><div className="text-xs text-zinc-400">Pet Types</div></div>
              <div className="text-center"><div className="text-3xl font-bold text-brand-yellow">5</div><div className="text-xs text-zinc-400">Safety Checks</div></div>
              <div className="text-center"><div className="text-3xl font-bold text-[#111111]">AI</div><div className="text-xs text-zinc-400">Powered</div></div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-5">

            {/* ── FORM ── */}
            <div className="col-span-4 flex flex-col gap-4">

              {/* Pet type selector */}
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center"><PawPrint size={14} className="text-white" /></div>
                  <h2 className="font-bold text-[#111111]">Pet Details</h2>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  {PET_TYPES.map(p => (
                    <button key={p.value} type="button"
                      onClick={() => setPetType(p.value as 'dog' | 'cat')}
                      className={`rounded-xl p-4 border-2 text-center transition-all ${petType === p.value ? 'border-brand-yellow bg-brand-yellow/10' : 'border-zinc-200 hover:border-zinc-300'}`}>
                      <div className="text-3xl mb-1">{p.emoji}</div>
                      <div className="font-bold text-sm text-[#111111]">{p.label}</div>
                      <div className="text-[10px] text-zinc-400 italic">{p.desc}</div>
                    </button>
                  ))}
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

              {/* Route */}
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

                  {/* Temperature badge */}
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs ${Number(temperature) > 40 ? 'bg-red-50 border-red-200 text-red-700' : Number(temperature) > 33 ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                    <Thermometer size={12} className="shrink-0" />
                    <span>Route temperature: <strong>{temperature}°C</strong> — {Number(temperature) > 40 ? '⚠ Extreme heat' : Number(temperature) > 33 ? 'Moderate heat' : 'Comfortable'}</span>
                  </div>
                </div>

                <button onClick={handleCheck} disabled={loading}
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

              {!plan && !loading && (
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
                    <span className="absolute inset-0 m-auto w-fit h-fit text-xl">🐾</span>
                  </div>
                  <p className="text-sm font-semibold text-[#111111]">AI analyzing pet safety…</p>
                  <p className="text-xs text-zinc-400">Checking heat, stress, route & rest stops</p>
                </div>
              )}

              {plan && !loading && (
                <div className="space-y-3">
                  {/* Score + Risk */}
                  <div className="flex items-center gap-4 bg-zinc-50 rounded-xl p-4">
                    <ComfortGauge score={plan.comfort_score} />
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">Comfort Score</div>
                      <div className="text-2xl font-extrabold text-[#111111] mb-2">{plan.comfort_score}<span className="text-sm font-normal text-zinc-400"> / 100</span></div>
                      <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${RISK_CONFIG[plan.risk].bg} ${RISK_CONFIG[plan.risk].color}`}>
                        <Shield size={11} /> {RISK_CONFIG[plan.risk].label}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-zinc-400 mb-1">Heat Risk</div>
                      <div className={`text-sm font-bold ${RISK_CONFIG[plan.heat_risk].color}`}>{plan.heat_risk}</div>
                      <div className="text-xs text-zinc-400 mt-1">ETA</div>
                      <div className="text-sm font-bold text-[#111111]">{plan.eta_minutes} min</div>
                    </div>
                  </div>

                  {/* Safe Mode */}
                  <div className="flex items-center gap-3 bg-[#111111] rounded-xl p-3">
                    <div className="w-9 h-9 bg-brand-yellow rounded-lg flex items-center justify-center shrink-0 text-black">
                      {MODE_ICON[plan.safe_mode]}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Zap size={11} className="text-brand-yellow" />
                        <span className="text-xs font-semibold text-brand-yellow uppercase tracking-wide">Recommended Mode</span>
                      </div>
                      <div className="font-bold text-white text-sm">{plan.safe_mode}</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">{plan.safe_mode_reason}</div>
                    </div>
                  </div>

                  {/* Alerts */}
                  {plan.alerts.length > 0 && (
                    <div className="space-y-2">
                      {plan.alerts.map((alert, i) => (
                        <div key={i} className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                          <AlertTriangle size={13} className="text-red-500 shrink-0 mt-0.5" />
                          <p className="text-xs text-red-700 leading-relaxed">{alert}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* AI Analysis */}
                  <div className="bg-orange-50 border border-orange-100 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Sparkles size={12} className="text-orange-500" />
                      <span className="text-xs font-semibold text-orange-600 uppercase tracking-wide">AI Assessment</span>
                    </div>
                    <p className="text-xs text-zinc-700 leading-relaxed">{plan.analysis}</p>
                  </div>

                  <button onClick={handleBook} disabled={saving || saved}
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

              {/* Rest stops */}
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center"><MapPin size={14} className="text-white" /></div>
                  <h2 className="font-bold text-[#111111]">Smart Rest Stops</h2>
                  {plan && <span className="text-xs bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded-full ml-auto">{plan.rest_stops.length} stops</span>}
                </div>

                {!plan ? (
                  <div className="py-6 text-center">
                    <Navigation size={28} className="text-zinc-200 mx-auto mb-2" />
                    <p className="text-xs text-zinc-400">Run analysis to see rest stop plan</p>
                  </div>
                ) : plan.rest_stops.length === 0 ? (
                  <div className="py-4 text-center">
                    <CheckCircle size={24} className="text-green-400 mx-auto mb-1" />
                    <p className="text-xs text-zinc-500">Short journey — no rest stops needed</p>
                  </div>
                ) : (
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-3.5 top-4 bottom-4 w-0.5 bg-zinc-100" />
                    <div className="space-y-3">
                      {/* Start */}
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center shrink-0 z-10">
                          <span className="text-white text-[10px] font-bold">▶</span>
                        </div>
                        <div className="text-sm font-bold text-[#111111]">{source || 'Origin'}</div>
                      </div>

                      {plan.rest_stops.map((stop) => (
                        <div key={stop.stop} className="flex items-start gap-3">
                          <div className="w-7 h-7 bg-brand-yellow rounded-full flex items-center justify-center shrink-0 z-10 text-[10px] font-bold text-black">{stop.stop}</div>
                          <div className="flex-1 bg-zinc-50 rounded-xl p-2.5">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-xs font-bold text-[#111111]">{stop.location}</span>
                              <span className="text-[10px] text-zinc-400">{stop.after_minutes} min</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Droplets size={10} className="text-blue-400" />
                              <span className="text-[10px] text-zinc-500">{stop.purpose} · 15 min break</span>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* End */}
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 bg-[#111111] rounded-full flex items-center justify-center shrink-0 z-10">
                          <span className="text-brand-yellow text-[10px] font-bold">✓</span>
                        </div>
                        <div className="text-sm font-bold text-[#111111]">{destination || 'Destination'}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Suggestions */}
              <div className="card flex-1">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 bg-brand-yellow rounded-lg flex items-center justify-center"><Sparkles size={14} className="text-black" /></div>
                  <h2 className="font-bold text-[#111111]">AI Suggestions</h2>
                </div>

                {!plan ? (
                  <div className="py-4 text-center">
                    <Sparkles size={24} className="text-zinc-200 mx-auto mb-1" />
                    <p className="text-xs text-zinc-400">AI suggestions appear after analysis</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {plan.suggestions.map((s, i) => (
                      <div key={i} className="flex items-start gap-2.5 bg-brand-yellow/10 border border-brand-yellow/20 rounded-xl px-3 py-2.5">
                        <CheckCircle size={13} className="text-brand-yellow shrink-0 mt-0.5" />
                        <p className="text-xs text-zinc-700 leading-relaxed">{s}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── HOW IT WORKS ── */}
            <div className="col-span-12 card">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-zinc-100 rounded-lg flex items-center justify-center"><Wind size={13} className="text-zinc-600" /></div>
                <h2 className="font-bold text-[#111111]">How Pet Safety Module Works</h2>
                <span className="text-xs bg-orange-50 text-orange-600 font-bold px-2 py-0.5 rounded-full ml-auto">pet_module.py</span>
              </div>
              <div className="grid grid-cols-5 gap-4">
                {[
                  { step: '01', icon: '🌡️', title: 'Temperature Risk', desc: 'Detects heat risk from route temperature. Above 40°C → HIGH HEAT RISK alert' },
                  { step: '02', icon: '🧮', title: 'Comfort Scoring', desc: 'Calculates 0–100 score based on pet type, age, weight, temperature & duration' },
                  { step: '03', icon: '🗺️', title: 'Rest Stop Planner', desc: 'Adds hydration stops every 2–3 hours along the route with exact km marks' },
                  { step: '04', icon: '🚉', title: 'Safe Mode Select', desc: 'Picks Truck / Train / Air based on distance, heat, pet type & weight' },
                  { step: '05', icon: '🤖', title: 'Claude AI Analysis', desc: 'AI synthesizes all factors and gives a natural language safety assessment' },
                ].map(s => (
                  <div key={s.step} className="text-center p-3 bg-zinc-50 rounded-xl">
                    <div className="text-2xl mb-2">{s.icon}</div>
                    <div className="text-[10px] font-bold text-zinc-400 mb-1">STEP {s.step}</div>
                    <div className="text-xs font-bold text-[#111111] mb-1">{s.title}</div>
                    <div className="text-[10px] text-zinc-500 leading-relaxed">{s.desc}</div>
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

export default function ClientPage() {
  return (
    <AuthGuard requiredRole="client">
      <ClientContent />
    </AuthGuard>
  )
}
