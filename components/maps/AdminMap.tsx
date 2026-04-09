'use client'
import { useState, useCallback, useEffect } from 'react'
import { GoogleMap, useJsApiLoader, OverlayView, Polyline, Polygon } from '@react-google-maps/api'
import { Shipment } from '@/lib/firestore'
import {
  CITY_COORDS, INDIA_CENTER, STATIC_RISK_ZONES, FLOOD_ZONE, STRIKE_ZONE,
  RISK_ZONE_COLORS, RiskZone, SHIPMENT_PROGRESS, interpolate,
} from '@/lib/mapData'
import {
  AlertTriangle, Layers, Zap, Truck, MapPin, Eye, EyeOff,
  Activity, CloudRain, Wind, X,
} from 'lucide-react'

const MAP_STYLES = [
  { featureType: 'all', elementType: 'labels.text.fill', stylers: [{ color: '#6b7280' }] },
  { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#a1a1aa' }] },
  { featureType: 'water', elementType: 'geometry.fill', stylers: [{ color: '#dbeafe' }] },
  { featureType: 'landscape', elementType: 'geometry.fill', stylers: [{ color: '#f9fafb' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#e5e7eb' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#d1d5db' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
]

const STATUS_COLORS: Record<string, string> = {
  in_transit: '#3b82f6',
  delayed:    '#ef4444',
  delivered:  '#22c55e',
  pending:    '#9ca3af',
}

interface AdminMapProps {
  shipments: Shipment[]
}

export default function AdminMap({ shipments }: AdminMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  })

  const [layers, setLayers] = useState({ crime: true, traffic: true, crisis: true })
  const [simulatedZones, setSimulatedZones] = useState<RiskZone[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [truckPositions, setTruckPositions] = useState<Record<string, { lat: number; lng: number }>>({})

  // Init truck positions from simulated progress data
  useEffect(() => {
    const positions: Record<string, { lat: number; lng: number }> = {}
    shipments.forEach(s => {
      const from = CITY_COORDS[s.source]
      const to   = CITY_COORDS[s.destination]
      if (from && to) {
        const frac = SHIPMENT_PROGRESS[s.id!] ?? 0.4
        positions[s.id!] = interpolate(from, to, frac)
      }
    })
    setTruckPositions(positions)
  }, [shipments])

  // Animate in-transit trucks slowly along their routes
  useEffect(() => {
    const id = setInterval(() => {
      setTruckPositions(prev => {
        const next = { ...prev }
        shipments
          .filter(s => s.status === 'in_transit')
          .forEach(s => {
            const from = CITY_COORDS[s.source]
            const to   = CITY_COORDS[s.destination]
            if (!from || !to || !next[s.id!]) return
            const cur  = next[s.id!]
            const span = to.lat - from.lat || 0.0001
            const frac = Math.min((cur.lat - from.lat) / span + 0.0015, 0.97)
            next[s.id!] = interpolate(from, to, frac)
          })
        return next
      })
    }, 3000)
    return () => clearInterval(id)
  }, [shipments])

  const onLoad = useCallback((map: google.maps.Map) => {
    // Fit bounds to show all of India nicely
    const bounds = new window.google.maps.LatLngBounds(
      { lat: 8.0, lng: 68.0 },
      { lat: 37.0, lng: 97.0 }
    )
    map.fitBounds(bounds)
  }, [])

  const toggleLayer = (layer: keyof typeof layers) =>
    setLayers(prev => ({ ...prev, [layer]: !prev[layer] }))

  const simulateCrisis = (type: 'flood' | 'strike') => {
    const zone = type === 'flood' ? FLOOD_ZONE : STRIKE_ZONE
    setSimulatedZones(prev =>
      prev.find(z => z.id === zone.id) ? prev : [...prev, zone]
    )
  }

  const visibleZones = [
    ...STATIC_RISK_ZONES.filter(z => {
      if (z.type === 'crime')   return layers.crime
      if (z.type === 'traffic') return layers.traffic
      if (z.type === 'crisis')  return layers.crisis
      return true
    }),
    ...simulatedZones,
  ]

  const selectedShipment = selectedId
    ? shipments.find(s => s.id === selectedId) ?? null
    : null

  if (loadError) {
    return (
      <div className="h-[520px] flex items-center justify-center bg-red-50 border border-red-200 rounded-2xl">
        <div className="text-center text-red-600">
          <AlertTriangle className="mx-auto mb-2" size={24} />
          <p className="font-semibold text-sm">Map failed to load</p>
          <p className="text-xs mt-1 text-red-400">Check your Google Maps API key</p>
        </div>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="h-[520px] flex items-center justify-center bg-zinc-50 rounded-2xl animate-pulse">
        <div className="text-center text-zinc-400">
          <MapPin className="mx-auto mb-2" size={24} />
          <p className="text-sm">Loading Intelligence Map…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-[520px]">

      {/* ── Layer toggles ── */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
        <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg border border-zinc-200 p-2.5">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide mb-2 flex items-center gap-1">
            <Layers size={10} /> Risk Layers
          </div>
          {([
            { key: 'crime'   as const, label: 'Crime',   color: '#ef4444' },
            { key: 'traffic' as const, label: 'Traffic',  color: '#f97316' },
            { key: 'crisis'  as const, label: 'Crisis',   color: '#8b5cf6' },
          ] as const).map(l => (
            <button key={l.key} onClick={() => toggleLayer(l.key)}
              className="flex items-center gap-2 w-full py-1 px-1.5 rounded-lg hover:bg-zinc-50 transition-all">
              <div className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: layers[l.key] ? l.color : '#d4d4d8' }} />
              <span className={`text-xs font-medium ${layers[l.key] ? 'text-zinc-700' : 'text-zinc-400'}`}>
                {l.label}
              </span>
              {layers[l.key]
                ? <Eye size={10} className="text-zinc-400 ml-auto" />
                : <EyeOff size={10} className="text-zinc-300 ml-auto" />}
            </button>
          ))}
        </div>

        {/* Crisis simulation */}
        <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg border border-zinc-200 p-2.5">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide mb-2 flex items-center gap-1">
            <Zap size={10} className="text-red-500" /> Simulate Crisis
          </div>
          <button onClick={() => simulateCrisis('flood')}
            className="flex items-center gap-1.5 w-full py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg transition-all mb-1">
            <CloudRain size={11} /> Flood
          </button>
          <button onClick={() => simulateCrisis('strike')}
            className="flex items-center gap-1.5 w-full py-1.5 px-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-lg transition-all mb-1">
            <Wind size={11} /> Strike
          </button>
          {simulatedZones.length > 0 && (
            <button onClick={() => setSimulatedZones([])}
              className="w-full py-1 text-[10px] text-zinc-400 hover:text-red-500 transition-colors text-center">
              Clear simulations
            </button>
          )}
        </div>
      </div>

      {/* ── Analytics overlay ── */}
      <div className="absolute top-3 right-3 z-10">
        <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg border border-zinc-200 p-3 w-44">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide mb-2 flex items-center gap-1">
            <Activity size={10} /> Fleet Analytics
          </div>
          {[
            { label: 'Active Routes', value: shipments.filter(s => s.status === 'in_transit').length, color: 'text-blue-600' },
            { label: 'Delayed',       value: shipments.filter(s => s.status === 'delayed').length,    color: 'text-red-600'  },
            { label: 'High Risk',     value: shipments.filter(s => s.delay_risk === 'high').length,   color: 'text-orange-600' },
            { label: 'Risk Zones',    value: visibleZones.length,                                      color: 'text-purple-600' },
          ].map(stat => (
            <div key={stat.label} className="flex items-center justify-between py-0.5">
              <span className="text-[10px] text-zinc-500">{stat.label}</span>
              <span className={`text-xs font-bold ${stat.color}`}>{stat.value}</span>
            </div>
          ))}
          {simulatedZones.length > 0 && (
            <div className="mt-1.5 pt-1.5 border-t border-zinc-100">
              <span className="text-[10px] text-red-600 font-semibold flex items-center gap-1">
                <Zap size={9} /> {simulatedZones.length} crisis simulated
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="absolute bottom-3 left-3 z-10">
        <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg border border-zinc-200 p-2.5">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide mb-2">Legend</div>
          <div className="space-y-1">
            {[
              { color: '#3b82f6', label: 'In Transit' },
              { color: '#ef4444', label: 'Delayed' },
              { color: '#22c55e', label: 'Delivered' },
              { color: '#9ca3af', label: 'Pending' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border-2 border-white shadow-sm"
                  style={{ background: item.color }} />
                <span className="text-[10px] text-zinc-600">{item.label}</span>
              </div>
            ))}
            <div className="pt-1 border-t border-zinc-100 mt-1 space-y-1">
              {[
                { color: '#ef4444', label: 'Crime zone' },
                { color: '#f97316', label: 'Traffic zone' },
                { color: '#8b5cf6', label: 'Crisis zone' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className="w-3 h-2 rounded opacity-60" style={{ background: item.color }} />
                  <span className="text-[10px] text-zinc-600">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Hint ── */}
      <div className="absolute bottom-3 right-3 z-10">
        <div className="bg-white/80 backdrop-blur rounded-lg px-3 py-1.5 border border-zinc-200 shadow">
          <span className="text-[10px] text-zinc-400">Click a truck to inspect shipment</span>
        </div>
      </div>

      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={INDIA_CENTER}
        zoom={5}
        onLoad={onLoad}
        options={{
          styles: MAP_STYLES,
          disableDefaultUI: true,
          zoomControl: true,
          zoomControlOptions: { position: 9 },
        }}
      >
        {/* Route polylines */}
        {shipments.map(s => {
          const from = CITY_COORDS[s.source]
          const to   = CITY_COORDS[s.destination]
          if (!from || !to) return null
          return (
            <Polyline
              key={`route-${s.id}`}
              path={[from, to]}
              options={{
                strokeColor:   STATUS_COLORS[s.status] || '#9ca3af',
                strokeOpacity: selectedId && selectedId !== s.id ? 0.18 : 0.7,
                strokeWeight:  selectedId === s.id ? 5 : 2.5,
                geodesic: true,
              }}
            />
          )
        })}

        {/* Source dots */}
        {shipments.map(s => {
          const pos = CITY_COORDS[s.source]
          if (!pos) return null
          return (
            <OverlayView key={`src-${s.id}`} position={pos} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
              <div className="-translate-x-1/2 -translate-y-1/2 pointer-events-none">
                <div className="w-2.5 h-2.5 bg-zinc-700 rounded-full border border-white shadow" />
              </div>
            </OverlayView>
          )
        })}

        {/* Destination dots */}
        {shipments.map(s => {
          const pos = CITY_COORDS[s.destination]
          if (!pos) return null
          return (
            <OverlayView key={`dst-${s.id}`} position={pos} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
              <div className="-translate-x-1/2 -translate-y-1/2 pointer-events-none">
                <div className="w-2.5 h-2.5 rounded-full border border-white shadow"
                  style={{ background: '#EAB308' }} />
              </div>
            </OverlayView>
          )
        })}

        {/* Animated truck markers */}
        {shipments.filter(s => s.status !== 'delivered').map(s => {
          const pos = truckPositions[s.id!]
          if (!pos) return null
          const color = STATUS_COLORS[s.status]
          return (
            <OverlayView key={`truck-${s.id}`} position={pos} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
              <button
                className="-translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group"
                onClick={() => setSelectedId(prev => prev === s.id ? null : s.id!)}
              >
                <div
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full border shadow-sm mb-0.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-white"
                  style={{ borderColor: color, color }}
                >
                  {s.id}
                </div>
                <div
                  className="relative w-7 h-7 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
                  style={{ background: color }}
                >
                  <Truck size={12} className="text-white" />
                  {s.status === 'delayed' && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-400 rounded-full border border-white animate-ping" />
                  )}
                </div>
              </button>
            </OverlayView>
          )
        })}

        {/* Risk zone polygons */}
        {visibleZones.map(zone => {
          const c = RISK_ZONE_COLORS[zone.type]
          return (
            <Polygon
              key={zone.id}
              paths={zone.path}
              options={{
                fillColor:    c.fill,
                fillOpacity:  0.22,
                strokeColor:  c.stroke,
                strokeOpacity: 0.75,
                strokeWeight: 2,
              }}
            />
          )
        })}

        {/* Risk zone centroid labels */}
        {visibleZones.map(zone => {
          const centroid = {
            lat: zone.path.reduce((s, p) => s + p.lat, 0) / zone.path.length,
            lng: zone.path.reduce((s, p) => s + p.lng, 0) / zone.path.length,
          }
          const c = RISK_ZONE_COLORS[zone.type]
          return (
            <OverlayView key={`lbl-${zone.id}`} position={centroid} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
              <div className="-translate-x-1/2 -translate-y-1/2 pointer-events-none">
                <div
                  className="text-[9px] font-bold px-2 py-0.5 rounded-lg border shadow-sm whitespace-nowrap"
                  style={{
                    background: c.fill + '22',
                    borderColor: c.stroke,
                    color: c.stroke,
                  }}
                >
                  ⚠ {zone.label}
                </div>
              </div>
            </OverlayView>
          )
        })}
      </GoogleMap>

      {/* ── Selected shipment detail card ── */}
      {selectedShipment && (
        <div className="absolute bottom-3 right-16 z-20 w-56">
          <div className="bg-white rounded-xl shadow-xl border border-zinc-200 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm text-zinc-900">{selectedShipment.id}</span>
              <button onClick={() => setSelectedId(null)} className="text-zinc-400 hover:text-zinc-700 transition-colors">
                <X size={14} />
              </button>
            </div>
            <div className="text-xs text-zinc-500 mb-2">{selectedShipment.source} → {selectedShipment.destination}</div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                selectedShipment.status === 'delayed'    ? 'bg-red-100 text-red-700' :
                selectedShipment.status === 'in_transit' ? 'bg-blue-100 text-blue-700' :
                selectedShipment.status === 'delivered'  ? 'bg-green-100 text-green-700' :
                'bg-zinc-100 text-zinc-600'
              }`}>
                {selectedShipment.status.replace('_', ' ')}
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                selectedShipment.delay_risk === 'high'   ? 'bg-red-100 text-red-700' :
                selectedShipment.delay_risk === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                {selectedShipment.delay_risk} risk
              </span>
            </div>
            <div className="text-[10px] text-zinc-400">ETA: {selectedShipment.eta} min · {selectedShipment.vehicle}</div>
            {selectedShipment.ai_analysis && (
              <p className="text-[10px] text-zinc-500 mt-1.5 leading-relaxed border-t border-zinc-100 pt-1.5">
                {selectedShipment.ai_analysis}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
