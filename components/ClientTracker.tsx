import { useState, useEffect } from 'react'
import { Shipment, subscribeToShipments } from '@/lib/firestore'
import { MapPin, Route, Clock, AlertTriangle, Truck, CheckCircle, BrainCircuit, Loader2 } from 'lucide-react'
import ClientMap from '@/components/maps/ClientMap'

export default function ClientTracker() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  
  const [xaiLoading, setXaiLoading] = useState(false)
  const [xaiExplanation, setXaiExplanation] = useState<string | null>(null)

  useEffect(() => {
    // Only grab shipments we'd care to track
    const unsub = subscribeToShipments((data) => {
      const activeOrDelayed = data.filter(s => 
        ['in_transit', 'delayed', 'pending', 'quote_pending'].includes(s.status)
      )
      setShipments(activeOrDelayed)
      if (selectedId && !activeOrDelayed.find(s => s.id === selectedId)) {
        if (activeOrDelayed.length > 0) setSelectedId(activeOrDelayed[0].id || null)
      } else if (!selectedId && activeOrDelayed.length > 0) {
        setSelectedId(activeOrDelayed[0].id || null)
      }
    })
    return () => unsub()
  }, [])

  const selected = shipments.find(s => s.id === selectedId)

  async function getExplanation(shipment: Shipment) {
    if (xaiExplanation || xaiLoading) return
    setXaiLoading(true)
    try {
      const res = await fetch('/api/ai-explain-delay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipmentId: shipment.id,
          source: shipment.source,
          destination: shipment.destination,
          distance: shipment.distance,
          route: shipment.route,
          vehicle: shipment.vehicle,
          eta: shipment.eta,
          delayRisk: shipment.delay_risk,
          aiAnalysis: shipment.ai_analysis
        })
      })
      const json = await res.json()
      if (json.explanation) {
        setXaiExplanation(json.explanation)
      } else {
        setXaiExplanation('Our AI is currently unable to provide specific details for this delay. Please check back shortly.')
      }
    } catch {
      setXaiExplanation('Our AI systems are experiencing high latency. Try again soon.')
    } finally {
      setXaiLoading(false)
    }
  }

  useEffect(() => {
    setXaiExplanation(null)
    setXaiLoading(false)
    
    // Automatically trigger explanation if delayed
    if (selected?.status === 'delayed') {
      getExplanation(selected)
    }
  }, [selectedId, selected?.status])

  if (!shipments.length) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl shadow-sm border border-zinc-100">
        <Route size={48} className="text-zinc-300 mb-4" />
        <h2 className="text-xl font-bold text-[#111111] mb-2">No Active Shipments</h2>
        <p className="text-zinc-500 text-center max-w-sm">
          You don't have any active shipments at the moment. Create a Pet or Freight order to start tracking.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-12 gap-6 h-full">
      
      {/* Sidebar List of Shipments */}
      <div className="col-span-4 flex flex-col gap-4">
        <h2 className="text-xl font-bold text-[#111111] pt-1">Active Deliveries</h2>
        <div className="flex flex-col gap-3 max-h-[800px] overflow-y-auto pr-2">
          {shipments.map(s => (
            <button
              key={s.id}
              onClick={() => setSelectedId(s.id || null)}
              className={`p-4 rounded-xl text-left border transition-all ${selectedId === s.id ? 'bg-black text-white border-black' : 'bg-white hover:bg-zinc-50 text-[#111111] border-zinc-200 shadow-sm'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">#{s.id?.slice(0, 6)}</span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${s.status === 'delayed' ? 'bg-red-500/20 text-red-500' : s.status === 'in_transit' ? 'bg-blue-500/20 text-blue-500' : 'bg-zinc-200 text-zinc-600'}`}>
                  {s.status.replace('_', ' ')}
                </span>
              </div>
              <div className="font-semibold">{s.source} <span className="mx-1 text-zinc-400">â†’</span> {s.destination}</div>
              <div className={`mt-2 flex items-center text-xs font-medium ${selectedId === s.id ? 'text-zinc-400' : 'text-zinc-500'}`}>
                <Truck size={14} className="mr-1.5" />
                {s.vehicle} {s.cargo_type ? `â€¢ ${s.cargo_type}` : s.pet_type ? `â€¢ Pet (${s.pet_type})` : ''}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Tracker Details */}
      <div className="col-span-8 bg-white border border-zinc-200 shadow-sm rounded-2xl p-6 flex flex-col gap-6">
        {selected ? (
          <>
            {/* Header info */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[#111111]">Tracking #{selected.id?.slice(0, 6)}</h2>
                <p className="text-zinc-500 flex items-center mt-1">
                  <MapPin size={14} className="mr-1 mt-0.5" />
                  {selected.source} to {selected.destination} ({selected.distance} km)
                </p>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold text-zinc-500">Est. Arrival</span>
                <span className="text-xl font-bold text-brand-yellow">
                  {selected.status === 'delayed' ? 'Delayed' : `${Math.floor(selected.eta / 60)}h ${selected.eta % 60}m`}
                </span>
              </div>
            </div>

            {/* Map Container */}
            <div className="h-[300px] w-full rounded-xl overflow-hidden min-h-[300px] border border-zinc-200 relative bg-zinc-50">
              <ClientMap shipment={selected} />
            </div>

            {/* Status Progress */}
            <div className="flex items-center gap-2 mt-2">
               <div className={`flex-1 h-2 rounded-full ${selected.status !== 'quote_pending' ? 'bg-brand-yellow' : 'bg-zinc-200'}`} />
               <div className={`flex-1 h-2 rounded-full ${(selected.status === 'in_transit' || selected.status === 'delayed' || selected.status === 'delivered') ? 'bg-brand-yellow' : 'bg-zinc-200'}`} />
               <div className={`flex-1 h-2 rounded-full ${selected.status === 'delivered' ? 'bg-green-500' : selected.status === 'delayed' ? 'bg-red-500' : 'bg-zinc-200'}`} />
            </div>
            <div className="flex justify-between text-xs font-semibold text-zinc-500 px-1 mb-2">
               <span>Booked</span>
               <span>In Transit</span>
               <span>{selected.status === 'delayed' ? 'Delayed' : 'Delivered'}</span>
            </div>

            {/* XAI Delay Insight */}
            {selected.status === 'delayed' && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-5 mt-2 transition-all">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-red-500 mt-1 shrink-0" size={24} />
                  <div className="flex-1">
                    <h3 className="font-bold text-red-900 text-lg flex items-center gap-2">
                      Shipment Delayed
                      <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-[10px] uppercase font-black tracking-wider flex items-center">
                        <BrainCircuit size={10} className="mr-1" /> XAI Insight
                      </span>
                    </h3>
                    {xaiLoading ? (
                      <div className="flex items-center gap-2 text-red-700 mt-3 font-medium text-sm">
                        <Loader2 size={16} className="animate-spin" />
                        AI is analyzing the root cause of this delay...
                      </div>
                    ) : (
                      <div className="prose prose-sm prose-p:my-2 mt-2 text-red-800 leading-relaxed font-medium">
                         {xaiExplanation || 'Delay details are being gathered. Check back soon.'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Additional details */}
            <div className="grid grid-cols-2 gap-4 mt-auto">
              <div className="p-4 bg-zinc-50 rounded-xl">
                 <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-1">Assigned Route</p>
                 <p className="font-medium text-sm text-[#111111]">{selected.route}</p>
                 <div className="mt-3 flex items-center gap-2">
                   <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 font-bold rounded capitalize">{selected.priority} priority</span>
                   {selected.delay_risk && <span className="text-[10px] px-2 py-0.5 bg-orange-100 text-orange-700 font-bold rounded capitalize">{selected.delay_risk} risk</span>}
                 </div>
              </div>
              <div className="p-4 bg-zinc-50 rounded-xl">
                 <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-1">Cargo Details</p>
                 <p className="font-medium text-sm text-[#111111]">{selected.weight} kg</p>
                 {selected.cargo_type && <p className="font-medium text-sm text-[#111111] mt-1">{selected.cargo_type}</p>}
                 {selected.pet_type && <p className="font-medium text-sm text-[#111111] mt-1">Pet Transport: {selected.pet_type}</p>}
              </div>
            </div>

          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin text-zinc-400" size={32} />
          </div>
        )}
      </div>

    </div>
  )
}
