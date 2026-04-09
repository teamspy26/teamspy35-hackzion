'use client'
import { useState, useCallback, useEffect, useRef } from 'react'
import { GoogleMap, useJsApiLoader, OverlayView, DirectionsRenderer } from '@react-google-maps/api'
import { Shipment } from '@/lib/firestore'
import { CITY_COORDS, REST_STOPS } from '@/lib/mapData'
import { AlertTriangle, CheckCircle, Coffee, MapPin, Navigation, Truck } from 'lucide-react'

const MAP_STYLES = [
  { featureType: 'poi.business',  elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit',       elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'water',         elementType: 'geometry.fill', stylers: [{ color: '#bfdbfe' }] },
  { featureType: 'landscape',     elementType: 'geometry.fill', stylers: [{ color: '#fafafa' }] },
  { featureType: 'road.highway',  elementType: 'geometry', stylers: [{ color: '#fde68a' }] },
  { featureType: 'road.highway',  elementType: 'geometry.stroke', stylers: [{ color: '#fbbf24' }] },
]

interface Alert {
  id: string
  type: 'break' | 'avoid' | 'stop'
  message: string
  dismissed: boolean
}

interface DriverMapProps {
  shipment: Shipment | null
}

export default function DriverMap({ shipment }: DriverMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  })

  const [directions,   setDirections]   = useState<google.maps.DirectionsResult | null>(null)
  const [truckPos,     setTruckPos]     = useState<{ lat: number; lng: number } | null>(null)
  const [alerts,       setAlerts]       = useState<Alert[]>([])
  const [displayPct,   setDisplayPct]   = useState(15)
  const routePath   = useRef<Array<{ lat: number; lng: number }>>([])
  const progressRef = useRef(0.15)
  const prevId      = useRef<string | null>(null)
  const animRef     = useRef<ReturnType<typeof setInterval> | null>(null)

  const restKey   = shipment ? `${shipment.source}-${shipment.destination}` : ''
  const restStops = REST_STOPS[restKey] || []

  const fetchRoute = useCallback(() => {
    if (!window.google || !shipment) return

    new window.google.maps.DirectionsService().route(
      {
        origin:      `${shipment.source}, India`,
        destination: `${shipment.destination}, India`,
        travelMode:  window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status !== 'OK' || !result) return
        setDirections(result)
        const path: Array<{ lat: number; lng: number }> = []
        result.routes[0].overview_path.forEach(pt =>
          path.push({ lat: pt.lat(), lng: pt.lng() })
        )
        routePath.current = path
        const idx = Math.floor(progressRef.current * (path.length - 1))
        if (path[idx]) setTruckPos(path[idx])
      }
    )
  }, [shipment])

  useEffect(() => {
    if (!isLoaded || !shipment) return
    if (prevId.current === shipment.id) return
    prevId.current = shipment.id || null

    setDirections(null)
    setTruckPos(null)
    progressRef.current = 0.15
    setDisplayPct(15)
    routePath.current = []

    fetchRoute()
  }, [isLoaded, shipment, fetchRoute])

  // Build alerts for this shipment
  useEffect(() => {
    if (!shipment) { setAlerts([]); return }
    const list: Alert[] = []
    if (shipment.eta > 150) {
      list.push({
        id: 'break-1', type: 'break', dismissed: false,
        message: 'Long journey ahead — take a 15-min break at the next stop',
      })
    }
    if (shipment.delay_risk === 'high') {
      list.push({
        id: 'avoid-1', type: 'avoid', dismissed: false,
        message: 'Risk zone ahead — switch to alternate highway immediately',
      })
    }
    if (restStops.length > 0) {
      list.push({
        id: 'stop-1', type: 'stop', dismissed: false,
        message: `Next stop: ${restStops[0].name} (${restStops[0].type})`,
      })
    }
    if (list.length === 0) {
      list.push({
        id: 'clear-1', type: 'stop', dismissed: false,
        message: 'Route clear — no hazards detected ahead',
      })
    }
    setAlerts(list)
  }, [shipment, restStops.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // Animate truck + update progress display
  useEffect(() => {
    if (animRef.current) clearInterval(animRef.current)
    if (!routePath.current.length) return

    animRef.current = setInterval(() => {
      progressRef.current = Math.min(progressRef.current + 0.0012, 0.99)
      setDisplayPct(Math.round(progressRef.current * 100))
      const idx = Math.floor(progressRef.current * (routePath.current.length - 1))
      if (routePath.current[idx]) setTruckPos(routePath.current[idx])
    }, 800)

    return () => { if (animRef.current) clearInterval(animRef.current) }
  }, [directions])

  const dismissAlert = (id: string) =>
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, dismissed: true } : a))

  const center = shipment
    ? (() => {
        const src = CITY_COORDS[shipment.source]
        const dst = CITY_COORDS[shipment.destination]
        if (src && dst) return { lat: (src.lat + dst.lat) / 2, lng: (src.lng + dst.lng) / 2 }
        return { lat: 15.5, lng: 78.5 }
      })()
    : { lat: 15.5, lng: 78.5 }

  const activeAlerts = alerts.filter(a => !a.dismissed)

  if (loadError) return (
    <div className="h-80 flex items-center justify-center bg-red-50 border border-red-200 rounded-2xl">
      <AlertTriangle className="text-red-500 mr-2" size={18} />
      <span className="text-red-600 text-sm">Navigation unavailable</span>
    </div>
  )

  if (!isLoaded) return (
    <div className="h-80 flex items-center justify-center bg-zinc-50 rounded-2xl animate-pulse">
      <Navigation className="text-zinc-400 mr-2" size={20} />
      <span className="text-zinc-400 text-sm">Loading navigation…</span>
    </div>
  )

  if (!shipment) return (
    <div className="h-80 flex flex-col items-center justify-center bg-zinc-50 rounded-2xl border border-zinc-200 border-dashed">
      <Truck size={32} className="text-zinc-200 mb-3" />
      <p className="text-zinc-400 text-sm">No active delivery</p>
      <p className="text-zinc-300 text-xs mt-1">Start a shipment to see navigation</p>
    </div>
  )

  return (
    <div className="relative w-full h-80 rounded-2xl overflow-hidden border border-zinc-200">

      {/* Driver nav card */}
      <div className="absolute top-3 left-3 z-10">
        <div className="bg-[#111111]/90 backdrop-blur rounded-xl shadow-xl p-3 w-44">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 bg-[#EAB308] rounded-lg flex items-center justify-center">
              <Navigation size={12} className="text-black" />
            </div>
            <span className="text-xs font-bold text-white">Navigation</span>
          </div>
          <div className="text-[10px] text-zinc-400 mb-0.5">{shipment.source}</div>
          <div className="text-[10px] text-zinc-400 mb-1.5">→ {shipment.destination}</div>
          <div className="text-[10px] text-[#EAB308] font-semibold mb-2">{shipment.eta} min ETA</div>
          {restStops.length > 0 && (
            <div className="border-t border-zinc-700 pt-2">
              <div className="text-[9px] text-zinc-500 uppercase tracking-wide mb-0.5">Next Stop</div>
              <div className="text-[10px] text-white font-medium">{restStops[0].name}</div>
              <div className="text-[9px] text-zinc-500 capitalize">{restStops[0].type}</div>
            </div>
          )}
        </div>
      </div>

      {/* Alert cards */}
      {activeAlerts.length > 0 && (
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 max-w-[190px]">
          {activeAlerts.slice(0, 3).map(alert => (
            <div
              key={alert.id}
              className={`rounded-xl p-2.5 border shadow-lg flex items-start gap-2 ${
                alert.type === 'avoid' ? 'bg-red-50 border-red-200' :
                alert.type === 'break' ? 'bg-yellow-50 border-yellow-200' :
                'bg-blue-50 border-blue-200'
              }`}
            >
              <div className={`shrink-0 mt-0.5 ${
                alert.type === 'avoid' ? 'text-red-500' :
                alert.type === 'break' ? 'text-yellow-600' : 'text-blue-500'
              }`}>
                {alert.type === 'avoid' ? <AlertTriangle size={11} /> :
                 alert.type === 'break' ? <Coffee size={11} /> :
                 <MapPin size={11} />}
              </div>
              <p className="text-[10px] text-zinc-700 leading-relaxed flex-1">{alert.message}</p>
              <button
                onClick={() => dismissAlert(alert.id)}
                className="shrink-0 text-zinc-300 hover:text-zinc-600 transition-colors mt-0.5"
              >
                <CheckCircle size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Progress bar */}
      <div className="absolute bottom-3 left-3 right-3 z-10">
        <div className="bg-white/90 backdrop-blur rounded-xl px-3 py-2 border border-zinc-200 shadow">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-zinc-500 font-semibold">{shipment.source}</span>
            <span className="text-[10px] text-zinc-400">{displayPct}% completed</span>
            <span className="text-[10px] text-zinc-500 font-semibold">{shipment.destination}</span>
          </div>
          <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-2 rounded-full bg-[#EAB308] transition-all duration-700 relative"
              style={{ width: `${displayPct}%` }}
            >
              <div className="absolute right-0 top-0 bottom-0 w-2 bg-yellow-300 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={center}
        zoom={7}
        options={{
          styles: MAP_STYLES,
          disableDefaultUI: true,
          zoomControl: true,
        }}
      >
        {/* Route — yellow highway style */}
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true,
              polylineOptions: {
                strokeColor:   '#EAB308',
                strokeOpacity: 0.9,
                strokeWeight:  6,
              },
            }}
          />
        )}

        {/* Source */}
        {CITY_COORDS[shipment.source] && (
          <OverlayView
            position={CITY_COORDS[shipment.source]}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <div className="-translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <div className="w-3.5 h-3.5 bg-zinc-800 rounded-full border-2 border-white shadow" />
            </div>
          </OverlayView>
        )}

        {/* Destination */}
        {CITY_COORDS[shipment.destination] && (
          <OverlayView
            position={CITY_COORDS[shipment.destination]}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <div className="-translate-x-1/2 -translate-y-full flex flex-col items-center gap-0.5 pointer-events-none">
              <div className="bg-black text-[#EAB308] text-[9px] font-bold px-2 py-0.5 rounded-full shadow whitespace-nowrap">
                {shipment.destination}
              </div>
              <div className="w-4 h-4 bg-black rounded-full border-2 border-[#EAB308] shadow flex items-center justify-center">
                <MapPin size={9} className="text-[#EAB308]" />
              </div>
            </div>
          </OverlayView>
        )}

        {/* Rest stop markers */}
        {restStops.map((stop, i) => (
          <OverlayView
            key={i}
            position={{ lat: stop.lat, lng: stop.lng }}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <div className="-translate-x-1/2 -translate-y-full flex flex-col items-center gap-0.5 pointer-events-none">
              <div className="bg-white text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-zinc-200 shadow whitespace-nowrap text-zinc-700">
                {stop.name}
              </div>
              <div
                className={`w-4 h-4 rounded-full border-2 border-white shadow flex items-center justify-center text-white ${
                  stop.type === 'fuel' ? 'bg-orange-500' :
                  stop.type === 'food' ? 'bg-green-500' : 'bg-blue-500'
                }`}
              >
                {stop.type === 'fuel' ? (
                  <span className="text-[7px] font-bold">⛽</span>
                ) : stop.type === 'food' ? (
                  <span className="text-[7px]">🍽</span>
                ) : (
                  <Coffee size={8} />
                )}
              </div>
            </div>
          </OverlayView>
        ))}

        {/* Animated truck */}
        {truckPos && (
          <OverlayView
            position={truckPos}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <div className="-translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <div className="w-10 h-10 bg-[#EAB308] rounded-full border-2 border-white shadow-xl flex items-center justify-center">
                <Truck size={18} className="text-black" />
              </div>
            </div>
          </OverlayView>
        )}
      </GoogleMap>
    </div>
  )
}
