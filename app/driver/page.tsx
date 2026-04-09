'use client'
import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import RiskBadge from '@/components/RiskBadge'
import StatusBadge from '@/components/StatusBadge'
import { mockShipments, mockDrivers } from '@/lib/mockData'
import { Shipment, updateShipmentStatus, subscribeToShipments } from '@/lib/firestore'
import {
  Truck,
  MapPin,
  Clock,
  CheckCircle,
  Play,
  AlertTriangle,
  Sparkles,
  Navigation,
  Package,
  ChevronRight,
  User,
  Activity,
} from 'lucide-react'
import clsx from 'clsx'

const DRIVER_ID = 'D1'
const DRIVER = mockDrivers.find(d => d.id === DRIVER_ID)!

type AiAlert = { shipmentId: string; message: string }

export default function DriverPanel() {
  const [shipments, setShipments] = useState<Shipment[]>(mockShipments)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [aiAlerts, setAiAlerts] = useState<AiAlert[]>([
    { shipmentId: 'S1', message: 'Traffic ahead on NH-48 — consider NH-44 alternate route' },
    { shipmentId: 'S5', message: 'Rain forecast in 30 mins — reduce speed in Odisha corridor' },
  ])
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null)

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

  const myShipments = shipments.filter(s => s.assigned_driver === DRIVER_ID)
  const activeShipment = myShipments.find(s => s.status === 'in_transit')
  const pendingShipments = myShipments.filter(s => s.status === 'pending')
  const completedShipments = myShipments.filter(s => s.status === 'delivered')

  async function handleStatusUpdate(shipment: Shipment, newStatus: 'in_transit' | 'delivered') {
    setUpdatingId(shipment.id!)
    try {
      await updateShipmentStatus(shipment.id!, newStatus)
    } catch {
      setShipments(prev =>
        prev.map(s => (s.id === shipment.id ? { ...s, status: newStatus } : s))
      )
    }
    setUpdatingId(null)
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-[1400px] mx-auto px-6 py-7">
        {/* Header */}
        <div className="flex items-start justify-between mb-7">
          <div>
            <h1 className="text-4xl font-bold text-[#111111] leading-tight">
              Driver
              <br />
              Execution Panel
            </h1>
            <p className="text-zinc-500 mt-1 text-sm">Manage your deliveries and follow AI suggestions</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#111111]">{myShipments.length}</div>
              <div className="text-xs text-zinc-400">Assigned</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-brand-yellow">{completedShipments.length}</div>
              <div className="text-xs text-zinc-400">Delivered</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#111111]">{pendingShipments.length}</div>
              <div className="text-xs text-zinc-400">Pending</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-5">
          {/* Driver Profile Card */}
          <div className="col-span-3 card bg-[#111111] text-white flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-brand-yellow rounded-xl flex items-center justify-center text-black font-bold text-xl">
                {DRIVER.name.charAt(0)}
              </div>
              <div>
                <div className="font-bold text-white">{DRIVER.name}</div>
                <div className="text-xs text-zinc-400">Driver · {DRIVER.vehicle}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-white">{myShipments.length}</div>
                <div className="text-xs text-zinc-400 mt-0.5">Trips</div>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-brand-yellow">{completedShipments.length}</div>
                <div className="text-xs text-zinc-400 mt-0.5">Done</div>
              </div>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-zinc-400">Completion Rate</span>
                <span className="text-xs font-bold text-white">
                  {myShipments.length > 0
                    ? Math.round((completedShipments.length / myShipments.length) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5">
                <div
                  className="bg-brand-yellow rounded-full h-1.5 transition-all"
                  style={{
                    width: `${
                      myShipments.length > 0
                        ? (completedShipments.length / myShipments.length) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-zinc-300">
                {activeShipment ? 'On Delivery' : 'Available'}
              </span>
            </div>
          </div>

          {/* Active delivery */}
          <div className="col-span-5 flex flex-col gap-4">
            {activeShipment ? (
              <div className="card border-2 border-brand-yellow/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-brand-yellow rounded-lg flex items-center justify-center">
                      <Navigation size={14} className="text-black" />
                    </div>
                    <span className="font-bold text-[#111111]">Active Delivery</span>
                  </div>
                  <StatusBadge status={activeShipment.status} />
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 bg-zinc-50 rounded-xl p-3">
                    <div className="text-xs text-zinc-400 mb-0.5">From</div>
                    <div className="font-bold text-[#111111]">{activeShipment.source}</div>
                  </div>
                  <ChevronRight size={18} className="text-zinc-400 shrink-0" />
                  <div className="flex-1 bg-brand-yellow/10 rounded-xl p-3">
                    <div className="text-xs text-zinc-400 mb-0.5">To</div>
                    <div className="font-bold text-[#111111]">{activeShipment.destination}</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-zinc-50 rounded-xl p-3 text-center">
                    <Clock size={14} className="text-brand-yellow mx-auto mb-1" />
                    <div className="font-bold text-lg text-[#111111]">{activeShipment.eta}</div>
                    <div className="text-xs text-zinc-400">mins ETA</div>
                  </div>
                  <div className="bg-zinc-50 rounded-xl p-3 text-center">
                    <Truck size={14} className="text-zinc-500 mx-auto mb-1" />
                    <div className="font-bold text-sm text-[#111111]">{activeShipment.vehicle}</div>
                    <div className="text-xs text-zinc-400">Vehicle</div>
                  </div>
                  <div className="bg-zinc-50 rounded-xl p-3 text-center">
                    <Activity size={14} className="text-zinc-500 mx-auto mb-1" />
                    <RiskBadge risk={activeShipment.delay_risk} size="sm" />
                    <div className="text-xs text-zinc-400 mt-1">Risk</div>
                  </div>
                </div>

                <div className="bg-zinc-50 rounded-xl p-3 mb-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Navigation size={12} className="text-zinc-400" />
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Route</span>
                  </div>
                  <div className="font-semibold text-sm text-[#111111]">{activeShipment.route}</div>
                </div>

                <button
                  onClick={() => handleStatusUpdate(activeShipment, 'delivered')}
                  disabled={updatingId === activeShipment.id}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-all disabled:opacity-60"
                >
                  <CheckCircle size={16} />
                  {updatingId === activeShipment.id ? 'Updating…' : 'Mark as Delivered'}
                </button>
              </div>
            ) : (
              <div className="card flex flex-col items-center justify-center py-12 text-center gap-3">
                <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center">
                  <Truck size={24} className="text-zinc-300" />
                </div>
                <p className="text-zinc-400 text-sm">No active delivery</p>
                <p className="text-xs text-zinc-300">Start a pending shipment below</p>
              </div>
            )}

            {/* Pending shipments */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-[#111111]">Pending Shipments</h3>
                <span className="text-xs font-semibold bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full">
                  {pendingShipments.length}
                </span>
              </div>
              <div className="space-y-2.5">
                {pendingShipments.length === 0 && (
                  <p className="text-sm text-zinc-400 text-center py-4">No pending shipments</p>
                )}
                {pendingShipments.map(s => (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 hover:bg-zinc-100 transition-all"
                  >
                    <div className="w-8 h-8 bg-zinc-200 rounded-lg flex items-center justify-center shrink-0">
                      <Package size={13} className="text-zinc-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#111111]">{s.id}</span>
                        <RiskBadge risk={s.delay_risk} size="sm" />
                      </div>
                      <div className="text-xs text-zinc-500 truncate">
                        {s.source} → {s.destination} · {s.eta} min
                      </div>
                    </div>
                    <button
                      onClick={() => handleStatusUpdate(s, 'in_transit')}
                      disabled={updatingId === s.id || !!activeShipment}
                      className="flex items-center gap-1 bg-brand-yellow text-black text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-yellow-400 transition-all disabled:opacity-50 shrink-0"
                    >
                      <Play size={10} />
                      Start
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Alerts + Completed */}
          <div className="col-span-4 flex flex-col gap-4">
            {/* AI Alerts */}
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-brand-yellow rounded-lg flex items-center justify-center">
                  <Sparkles size={14} className="text-black" />
                </div>
                <h3 className="font-bold text-[#111111]">AI Suggestions</h3>
              </div>
              <div className="space-y-3">
                {aiAlerts.map((alert, i) => (
                  <div
                    key={i}
                    className="bg-brand-yellow/10 border border-brand-yellow/30 rounded-xl p-3"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Sparkles size={12} className="text-brand-yellow" />
                      <span className="text-xs font-bold text-yellow-700">
                        Shipment {alert.shipmentId}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-700">{alert.message}</p>
                  </div>
                ))}
                <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <AlertTriangle size={12} className="text-red-500" />
                    <span className="text-xs font-bold text-red-600">Safety Alert</span>
                  </div>
                  <p className="text-sm text-zinc-700">
                    High delay risk detected on your route — check in with dispatch before proceeding
                  </p>
                </div>
              </div>
            </div>

            {/* Completed */}
            <div className="card flex-1">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-[#111111]">Completed Today</h3>
                <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  {completedShipments.length} done
                </span>
              </div>
              <div className="space-y-2">
                {completedShipments.length === 0 && (
                  <p className="text-sm text-zinc-400 text-center py-4">No deliveries yet</p>
                )}
                {completedShipments.map(s => (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-green-50 border border-green-100"
                  >
                    <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                      <CheckCircle size={13} className="text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-[#111111]">{s.id}</div>
                      <div className="text-xs text-zinc-500 truncate">
                        {s.source} → {s.destination}
                      </div>
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
