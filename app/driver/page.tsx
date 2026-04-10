'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import Sidebar from '@/components/Sidebar'
import RiskBadge from '@/components/RiskBadge'
import StatusBadge from '@/components/StatusBadge'
import AuthGuard from '@/components/AuthGuard'
import { mockShipments, mockDrivers } from '@/lib/mockData'
import { Shipment, updateShipmentStatus, subscribeToShipments } from '@/lib/firestore'
import { useAuth } from '@/context/AuthContext'
import {
  Truck, Clock, CheckCircle, Play, AlertTriangle,
  Sparkles, Navigation, Package, ChevronRight, Activity,
  Loader2, Route, Shield, LogOut, Volume2, VolumeX, Globe } from 'lucide-react'
import DriverMap from '@/components/maps/DriverMap'
import { TRANSLATIONS, LangCode, speakText } from '@/lib/translations'
import clsx from 'clsx'

const DRIVER_ID = 'D1'
const DRIVER = mockDrivers.find(d => d.id === DRIVER_ID)!

function DriverContent() {
  const { logout } = useAuth()
  const { user } = useAuth()
  const [shipments, setShipments] = useState<Shipment[]>(mockShipments)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [liveData, setLiveData] = useState(false)
  const [activeSection, setActiveSection] = useState('overview')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [progress, setProgress] = useState(5)
  const [lang, setLang] = useState<LangCode>('en')
  const [voiceOn, setVoiceOn] = useState(true)
  const t = TRANSLATIONS[lang]
  // Simulate 10 min already elapsed for realistic demo start
  const deliveryStartRef = useRef(Date.now() - 1000 * 60 * 10)

  useEffect(() => {
    const unsub = subscribeToShipments(data => {
      if (data.length > 0) { setShipments(data); setLiveData(true) }
    })
    return () => unsub()
  }, [])

  const myShipments = shipments.filter(s => s.assigned_driver === DRIVER_ID)
  const activeShipment = myShipments.find(s => s.status === 'in_transit')

  // Progress = (elapsedTime / eta) * 100  — must be after activeShipment is computed
  useEffect(() => {
    const tick = () => {
      if (activeShipment?.eta) {
        const elapsedMin = (Date.now() - deliveryStartRef.current) / 60000
        setProgress(Math.min(Math.round((elapsedMin / activeShipment.eta) * 100), 95))
      } else {
        setProgress(p => Math.min(p + 1, 95))
      }
    }
    tick()
    const t = setInterval(tick, 5000)
    return () => clearInterval(t)
  }, [activeShipment])
  const pendingShipments = myShipments.filter(s => s.status === 'pending')
  const completedShipments = myShipments.filter(s => s.status === 'delivered')

  // Dynamic AI suggestions derived from actual shipment state (3.3 rerouting + 3.5 alerts)
  const aiSuggestions = useMemo(() => {
    const list: Array<{ type: string; shipmentId: string; message: string; timeSaved: number }> = []
    if (activeShipment) {
      if (activeShipment.delay_risk === 'high') {
        list.push({ type: 'reroute', shipmentId: activeShipment.id!, message: `High delay risk on ${activeShipment.route} — switch to alternate highway, save ~15 mins`, timeSaved: 15 })
      }
      if (activeShipment.delay_risk !== 'low') {
        list.push({ type: 'weather', shipmentId: activeShipment.id!, message: `Weather advisory near ${activeShipment.destination} corridor — reduce speed and allow extra buffer`, timeSaved: 0 })
      }
      if (activeShipment.eta > 150) {
        list.push({ type: 'traffic', shipmentId: activeShipment.id!, message: `Long route (${activeShipment.eta} min ETA) — peak traffic window approaching, adjust timing`, timeSaved: 10 })
      }
    }
    pendingShipments.slice(0, 1).forEach(s => {
      list.push({ type: 'traffic', shipmentId: s.id!, message: `Upcoming shipment to ${s.destination} — pre-check route conditions before departure`, timeSaved: 0 })
    })
    if (list.length === 0) {
      list.push(
        { type: 'reroute', shipmentId: 'S1', message: 'All routes clear — optimal conditions, no rerouting needed', timeSaved: 0 },
        { type: 'weather', shipmentId: 'S2', message: 'Weather clear across all active corridors', timeSaved: 0 }
      )
    }
    return list
  }, [activeShipment, pendingShipments])

  // Dynamic risk alerts from actual shipment delay_risk data (3.5 monitoring)
  const riskAlerts = useMemo(() =>
    myShipments
      .filter(s => s.delay_risk === 'high' || s.delay_risk === 'medium')
      .slice(0, 3)
      .map(s => ({
        level: s.delay_risk,
        message: s.ai_analysis || `${s.delay_risk === 'high' ? 'High' : 'Medium'} delay risk — ${s.source} → ${s.destination} route affected`,
      })),
  [myShipments])

  async function handleStatusUpdate(shipment: Shipment, newStatus: 'in_transit' | 'delivered') {
    setUpdatingId(shipment.id!)
    try {
      await updateShipmentStatus(shipment.id!, newStatus)
    } catch {
      setShipments(prev => prev.map(s => s.id === shipment.id ? { ...s, status: newStatus } : s))
    }
    setUpdatingId(null)
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-4 sm:py-7">

        {/* Language + Voice bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Globe size={14} className="text-zinc-400 shrink-0" />
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden sm:inline">Language</span>
            <div className="flex gap-1.5 flex-wrap">
              {(Object.keys(TRANSLATIONS) as LangCode[]).map(code => (
                <button
                  key={code}
                  onClick={() => {
                    setLang(code)
                    if (voiceOn) speakText(TRANSLATIONS[code].voice.activeDelivery, TRANSLATIONS[code].langCode)
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                    lang === code
                      ? 'bg-[#111111] text-white border-[#111111]'
                      : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400'
                  }`}
                >
                  {TRANSLATIONS[code].langName}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => {
              setVoiceOn(v => !v)
              if (!voiceOn && activeSection) speakText(t.voice.activeDelivery, t.langCode)
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shrink-0 ${
              voiceOn
                ? 'bg-brand-yellow/10 border-brand-yellow text-yellow-700'
                : 'bg-white border-zinc-200 text-zinc-400'
            }`}
          >
            {voiceOn ? <Volume2 size={13} /> : <VolumeX size={13} />}
            <span className="hidden sm:inline">{voiceOn ? 'Voice ON' : 'Voice OFF'}</span>
            <span className="sm:hidden">{voiceOn ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-4xl font-bold text-[#111111] leading-tight">
              {t.title.split(' ').slice(0,1).join(' ')}{' '}
              <span className="hidden sm:inline"><br /></span>
              {t.title.split(' ').slice(1).join(' ')}
            </h1>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <p className="text-zinc-500 text-xs sm:text-sm hidden sm:block">{t.subtitle}</p>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${liveData ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-500'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${liveData ? 'bg-green-500 animate-pulse' : 'bg-zinc-400'}`} />
                {liveData ? 'Live' : 'Demo'}
              </span>
            </div>
          </div>

          {/* Stats — hidden on smallest screens, shown inline on sm+ */}
          <div className="hidden sm:flex items-center gap-4 shrink-0">
            <div className="text-center"><div className="text-2xl font-bold text-[#111111]">{myShipments.length}</div><div className="text-xs text-zinc-400">Assigned</div></div>
            <div className="text-center"><div className="text-2xl font-bold text-brand-yellow">{completedShipments.length}</div><div className="text-xs text-zinc-400">Delivered</div></div>
            <div className="text-center"><div className="text-2xl font-bold text-[#111111]">{pendingShipments.length}</div><div className="text-xs text-zinc-400">Pending</div></div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 bg-brand-yellow rounded-full text-black font-bold text-base sm:text-lg shadow-sm border border-yellow-200">
              👤
            </div>
            <button onClick={logout} className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold transition-all border border-red-200 text-xs sm:text-sm">
              <LogOut size={14} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Stat strip — mobile only */}
        <div className="flex sm:hidden items-center justify-around bg-white rounded-2xl border border-zinc-100 p-3 mb-4 shadow-sm">
          <div className="text-center"><div className="text-xl font-bold text-[#111111]">{myShipments.length}</div><div className="text-[10px] text-zinc-400">Assigned</div></div>
          <div className="w-px h-8 bg-zinc-100" />
          <div className="text-center"><div className="text-xl font-bold text-brand-yellow">{completedShipments.length}</div><div className="text-[10px] text-zinc-400">Delivered</div></div>
          <div className="w-px h-8 bg-zinc-100" />
          <div className="text-center"><div className="text-xl font-bold text-[#111111]">{pendingShipments.length}</div><div className="text-[10px] text-zinc-400">Pending</div></div>
        </div>

        <div className="grid grid-cols-12 gap-4 sm:gap-5">

          {/* Navigation Map */}
          <div className="col-span-12 card !p-0 overflow-hidden">
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 border-b border-zinc-100">
              <div>
                <h3 className="font-bold text-[#111111]">{t.navigation}</h3>
                <p className="text-xs text-zinc-400 mt-0.5 hidden sm:block">Turn-by-turn route · Rest stops · Live alerts</p>
              </div>
              {activeShipment ? (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-medium text-zinc-600 truncate max-w-[120px] sm:max-w-none">{activeShipment.source} → {activeShipment.destination}</span>
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0" />
                  <span className="text-blue-600 font-semibold hidden sm:inline">Active</span>
                </div>
              ) : (
                <span className="text-xs text-zinc-400">{t.noActiveDelivery}</span>
              )}
            </div>
            <div className="p-3 sm:p-4">
              <DriverMap shipment={activeShipment ?? null} />
            </div>
          </div>

          {/* Driver Profile */}
          <div className="col-span-12 md:col-span-3 card bg-[#111111] text-white flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 sm:w-12 sm:h-12 bg-brand-yellow rounded-xl flex items-center justify-center text-black font-bold text-xl shrink-0">
                {(user?.displayName ?? DRIVER.name).charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-white truncate">{user?.displayName ?? DRIVER.name}</div>
                <div className="text-xs text-zinc-400">Driver · {DRIVER.vehicle}</div>
              </div>
              <div className="ml-auto flex items-center gap-1.5 md:hidden">
                <div className={clsx('w-2 h-2 rounded-full', activeShipment ? 'bg-blue-400 animate-pulse' : 'bg-green-400')} />
                <span className="text-xs text-zinc-300">{activeShipment ? 'On Delivery' : 'Available'}</span>
              </div>
            </div>
            <div className="grid grid-cols-4 md:grid-cols-2 gap-3">
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-white">{myShipments.length}</div>
                <div className="text-xs text-zinc-400 mt-0.5">Trips</div>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-brand-yellow">{completedShipments.length}</div>
                <div className="text-xs text-zinc-400 mt-0.5">Done</div>
              </div>
              {/* Completion rate — col-span-2 on mobile to fill row */}
              <div className="col-span-2 bg-white/10 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-zinc-400">{t.completionRate}</span>
                  <span className="text-xs font-bold text-white">
                    {myShipments.length > 0 ? Math.round((completedShipments.length / myShipments.length) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5">
                  <div className="bg-brand-yellow rounded-full h-1.5 transition-all"
                    style={{ width: `${myShipments.length > 0 ? (completedShipments.length / myShipments.length) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <div className={clsx('w-2 h-2 rounded-full', activeShipment ? 'bg-blue-400 animate-pulse' : 'bg-green-400')} />
              <span className="text-xs text-zinc-300">{activeShipment ? 'On Delivery' : 'Available'}</span>
            </div>
          </div>

          {/* Active delivery */}
          <div className="col-span-12 md:col-span-5 flex flex-col gap-4">
            {activeShipment ? (
              <div className="card border-2 border-brand-yellow/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-brand-yellow rounded-lg flex items-center justify-center shrink-0">
                      <Navigation size={14} className="text-black" />
                    </div>
                    <span className="font-bold text-[#111111]">{t.activeDelivery}</span>
                  </div>
                  <StatusBadge status={activeShipment.status} />
                </div>

                {/* Source → Dest */}
                <div className="flex items-center gap-2 sm:gap-3 mb-4">
                  <div className="flex-1 bg-zinc-50 rounded-xl p-2.5 sm:p-3">
                    <div className="text-xs text-zinc-400 mb-0.5">{t.from}</div>
                    <div className="font-bold text-[#111111] text-sm sm:text-base truncate">{activeShipment.source}</div>
                  </div>
                  <ChevronRight size={16} className="text-zinc-400 shrink-0" />
                  <div className="flex-1 bg-brand-yellow/10 rounded-xl p-2.5 sm:p-3">
                    <div className="text-xs text-zinc-400 mb-0.5">{t.to}</div>
                    <div className="font-bold text-[#111111] text-sm sm:text-base truncate">{activeShipment.destination}</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="bg-zinc-50 rounded-xl p-3 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Navigation size={13} className="text-brand-yellow" />
                      <span className="text-xs font-semibold text-zinc-600">{t.deliveryProgress}</span>
                    </div>
                    <span className="text-xs font-bold text-[#111111]">{progress}%</span>
                  </div>
                  <div className="w-full bg-zinc-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-3 rounded-full bg-brand-yellow transition-all duration-1000 relative"
                      style={{ width: `${progress}%` }}
                    >
                      <div className="absolute right-0 top-0 bottom-0 w-3 bg-yellow-300 rounded-full animate-pulse" />
                    </div>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-zinc-400">{activeShipment.source}</span>
                    <span className="text-[10px] text-zinc-400">{activeShipment.destination}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
                  <div className="bg-zinc-50 rounded-xl p-2.5 sm:p-3 text-center">
                    <Clock size={14} className="text-brand-yellow mx-auto mb-1" />
                    <div className="font-bold text-base sm:text-lg text-[#111111]">{activeShipment.eta}</div>
                    <div className="text-xs text-zinc-400">min ETA</div>
                  </div>
                  <div className="bg-zinc-50 rounded-xl p-2.5 sm:p-3 text-center">
                    <Truck size={14} className="text-zinc-500 mx-auto mb-1" />
                    <div className="font-bold text-xs sm:text-sm text-[#111111]">{activeShipment.vehicle}</div>
                    <div className="text-xs text-zinc-400">Vehicle</div>
                  </div>
                  <div className="bg-zinc-50 rounded-xl p-2.5 sm:p-3 text-center">
                    <Activity size={14} className="text-zinc-500 mx-auto mb-1" />
                    <RiskBadge risk={activeShipment.delay_risk} size="sm" />
                    <div className="text-xs text-zinc-400 mt-1">Risk</div>
                  </div>
                </div>

                {/* Route */}
                <div className="bg-zinc-50 rounded-xl p-3 mb-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Route size={12} className="text-zinc-400" />
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">{t.currentRoute}</span>
                  </div>
                  <div className="font-semibold text-sm text-[#111111]">{activeShipment.route}</div>
                </div>

                <button onClick={() => handleStatusUpdate(activeShipment, 'delivered')}
                  disabled={updatingId === activeShipment.id}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-all disabled:opacity-60 text-sm sm:text-base">
                  {updatingId === activeShipment.id
                    ? <><Loader2 size={15} className="animate-spin" />Updating…</>
                    : <><CheckCircle size={16} />{t.markDelivered}</>}
                </button>
              </div>
            ) : (
              <div className="card flex flex-col items-center justify-center py-10 sm:py-12 text-center gap-3">
                <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center">
                  <Truck size={24} className="text-zinc-300" />
                </div>
                <p className="text-zinc-400 text-sm">{t.noActiveDelivery}</p>
                <p className="text-xs text-zinc-300">{t.startPrompt}</p>
              </div>
            )}

            {/* Pending shipments */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-[#111111]">{t.pendingShipments}</h3>
                <span className="text-xs font-semibold bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full">{pendingShipments.length}</span>
              </div>
              <div className="space-y-2.5">
                {pendingShipments.length === 0 && <p className="text-sm text-zinc-400 text-center py-4">No pending shipments</p>}
                {pendingShipments.map(s => (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 hover:bg-zinc-100 transition-all">
                    <div className="w-8 h-8 bg-zinc-200 rounded-lg flex items-center justify-center shrink-0">
                      <Package size={13} className="text-zinc-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#111111]">{s.id}</span>
                        <RiskBadge risk={s.delay_risk} size="sm" />
                      </div>
                      <div className="text-xs text-zinc-500 truncate">{s.source} → {s.destination} · {s.eta} {t.mins}</div>
                    </div>
                    <button onClick={() => handleStatusUpdate(s, 'in_transit')}
                      disabled={updatingId === s.id || !!activeShipment}
                      className="flex items-center gap-1 bg-brand-yellow text-black text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-yellow-400 transition-all disabled:opacity-50 shrink-0">
                      {updatingId === s.id ? <Loader2 size={10} className="animate-spin" /> : <Play size={10} />}
                      {t.start}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Suggestions + Alerts + Completed */}
          <div className="col-span-12 md:col-span-4 flex flex-col gap-4">

            {/* AI Rerouting Suggestions */}
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-brand-yellow rounded-lg flex items-center justify-center">
                  <Sparkles size={14} className="text-black" />
                </div>
                <h3 className="font-bold text-[#111111]">{t.aiSuggestions}</h3>
              </div>
              <div className="space-y-3">
                {aiSuggestions.map((alert, i) => (
                  <div key={i} className={clsx(
                    'rounded-xl p-3 border',
                    alert.type === 'reroute' ? 'bg-brand-yellow/10 border-brand-yellow/30' : 'bg-blue-50 border-blue-100'
                  )}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        {alert.type === 'reroute' ? <Route size={12} className="text-brand-yellow" /> : <Sparkles size={12} className="text-blue-500" />}
                        <span className={clsx('text-xs font-bold', alert.type === 'reroute' ? 'text-yellow-700' : 'text-blue-700')}>
                          Shipment {alert.shipmentId}
                        </span>
                      </div>
                      {alert.timeSaved > 0 && (
                        <span className="text-[10px] bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded-full">
                          -{alert.timeSaved} min
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-700 leading-relaxed">{alert.message}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Alerts */}
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-red-100 rounded-lg flex items-center justify-center">
                  <Shield size={14} className="text-red-600" />
                </div>
                <h3 className="font-bold text-[#111111]">{t.riskAlerts}</h3>
              </div>
              <div className="space-y-2.5">
                {riskAlerts.length === 0 && <p className="text-sm text-zinc-400 text-center py-3">No active risk alerts</p>}
                {riskAlerts.map((alert, i) => (
                  <div key={i} className={clsx(
                    'flex items-start gap-2.5 rounded-xl p-3 border',
                    alert.level === 'high' ? 'bg-red-50 border-red-100' : 'bg-orange-50 border-orange-100'
                  )}>
                    <AlertTriangle size={14} className={clsx('shrink-0 mt-0.5', alert.level === 'high' ? 'text-red-500' : 'text-orange-500')} />
                    <p className="text-xs text-zinc-700 leading-relaxed">{alert.message}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Completed */}
            <div className="card flex-1">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-[#111111]">{t.completedToday}</h3>
                <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{completedShipments.length} done</span>
              </div>
              <div className="space-y-2">
                {completedShipments.length === 0 && <p className="text-sm text-zinc-400 text-center py-4">No deliveries yet</p>}
                {completedShipments.map(s => (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-green-50 border border-green-100">
                    <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                      <CheckCircle size={13} className="text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-[#111111]">{s.id}</div>
                      <div className="text-xs text-zinc-500 truncate">{s.source} → {s.destination}</div>
                    </div>
                    <span className="text-xs text-green-600 font-semibold shrink-0">✓ Done</span>
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

export default function DriverPage() {
  return (
    <AuthGuard requiredRole="driver">
      <DriverContent />
    </AuthGuard>
  )
}
