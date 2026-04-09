'use client'
import { useState, useCallback, useEffect, useRef } from 'react'
import { GoogleMap, useJsApiLoader, OverlayView, DirectionsRenderer } from '@react-google-maps/api'
import { Shipment } from '@/lib/firestore'
import { CITY_COORDS } from '@/lib/mapData'
import { AlertTriangle, CheckCircle, XCircle, Navigation, Truck, MapPin, Route } from 'lucide-react'

const MAP_STYLES = [
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry.fill', stylers: [{ color: '#dbeafe' }] },
  { featureType: 'landscape', elementType: 'geometry.fill', stylers: [{ color: '#f8fafc' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#e5e7eb' }] },
]

interface OperatorMapProps {
  shipment: Shipment | null
}

type RouteApproval = 'approved' | 'rejected' | null

export default function OperatorMap({ shipment }: OperatorMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  })

  const [directions,    setDirections]    = useState<google.maps.DirectionsResult | null>(null)
  const [altDirections, setAltDirections] = useState<google.maps.DirectionsResult | null>(null)
  const [truckPos,      setTruckPos]      = useState<{ lat: number; lng: number } | null>(null)
  const [showAlert,     setShowAlert]     = useState(false)
  const [approval,      setApproval]      = useState<RouteApproval>(null)
  const routePath   = useRef<Array<{ lat: number; lng: number }>>([])
  const progressRef = useRef(0.28)
  const prevId      = useRef<string | null>(null)
  const animRef     = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchRoutes = useCallback(() => {
    if (!window.google || !shipment) return

    const service = new window.google.maps.DirectionsService()

    // Primary route
    service.route(
      {
        origin:      `${shipment.source}, India`,
        destination: `${shipment.destination}, India`,
        travelMode:  window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK' && result) {
          setDirections(result)
          const path: Array<{ lat: number; lng: number }> = []
          result.routes[0].overview_path.forEach(pt =>
            path.push({ lat: pt.lat(), lng: pt.lng() })
          )
          routePath.current = path
          const idx = Math.floor(progressRef.current * (path.length - 1))
          if (path[idx]) setTruckPos(path[idx])
        }
      }
    )

    // Alternate (avoid highways) route
    service.route(
      {
        origin:        `${shipment.source}, India`,
        destination:   `${shipment.destination}, India`,
        travelMode:    window.google.maps.TravelMode.DRIVING,
        avoidHighways: true,
      },
      (result, status) => {
        if (status === 'OK' && result) setAltDirections(result)
      }
    )
  }, [shipment])

  // Fetch routes whenever shipment changes (and Maps is ready)
  useEffect(() => {
    if (!isLoaded || !shipment) return
    if (prevId.current === shipment.id) return
    prevId.current = shipment.id || null

    setDirections(null)
    setAltDirections(null)
    setTruckPos(null)
    setApproval(null)
    progressRef.current = 0.28
    routePath.current = []

    fetchRoutes()
  }, [isLoaded, shipment, fetchRoutes])

  // Show alert for high/medium risk shipments
  useEffect(() => {
    if (!shipment) return
    setShowAlert(false)
    if (shipment.delay_risk === 'high' || shipment.delay_risk === 'medium') {
      const t = setTimeout(() => setShowAlert(true), 1400)
      return () => clearTimeout(t)
    }
  }, [shipment])

  // Animate truck along route
  useEffect(() => {
    if (animRef.current) clearInterval(animRef.current)
    if (!routePath.current.length) return

    animRef.current = setInterval(() => {
      progressRef.current = progressRef.current + 0.004
      if (progressRef.current >= 1) progressRef.current = 0.05
      const idx = Math.floor(progressRef.current * (routePath.current.length - 1))
      if (routePath.current[idx]) setTruckPos(routePath.current[idx])
    }, 500)

    return () => {
      if (animRef.current) clearInterval(animRef.current)
    }
  }, [directions])

  const center = shipment
    ? (() => {
        const src = CITY_COORDS[shipment.source]
        const dst = CITY_COORDS[shipment.destination]
        if (src && dst) return { lat: (src.lat + dst.lat) / 2, lng: (src.lng + dst.lng) / 2 }
        return { lat: 15.5, lng: 78.5 }
      })()
    : { lat: 15.5, lng: 78.5 }

  if (loadError) return (
    <div className="h-80 flex items-center justify-center bg-red-50 border border-red-200 rounded-2xl">
      <AlertTriangle className="text-red-500 mr-2" size={20} />
      <span className="text-red-600 text-sm font-medium">Map failed to load</span>
    </div>
  )

  if (!isLoaded) return (
    <div className="h-80 flex items-center justify-center bg-zinc-50 rounded-2xl animate-pulse">
      <MapPin className="text-zinc-400 mr-2" size={20} />
      <span className="text-zinc-400 text-sm">Loading map…</span>
    </div>
  )

  if (!shipment) return (
    <div className="h-80 flex flex-col items-center justify-center bg-zinc-50 rounded-2xl border border-zinc-200 border-dashed">
      <Route size={32} className="text-zinc-200 mb-3" />
      <p className="text-zinc-400 text-sm font-medium">No shipment selected</p>
      <p className="text-zinc-300 text-xs mt-1">Generate an AI plan to visualise the route</p>
    </div>
  )

  const riskColor = shipment.delay_risk === 'high'   ? '#ef4444' :
                    shipment.delay_risk === 'medium'  ? '#eab308' : '#22c55e'

  return (
    <div className="relative w-full h-80 rounded-2xl overflow-hidden border border-zinc-200">

      {/* Alert banner */}
      {showAlert && approval === null && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-red-600 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-bold flex items-center gap-2 animate-bounce-in">
          <AlertTriangle size={13} />
          High-risk zone detected on route!
        </div>
      )}

      {/* Route info card */}
      <div className="absolute top-3 left-3 z-10">
        <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg border border-zinc-200 p-2.5 w-44">
          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1">Active Route</div>
          <div className="text-sm font-bold text-zinc-900">{shipment.id}</div>
          <div className="text-[10px] text-zinc-500 mt-0.5 mb-1.5">
            {shipment.source} → {shipment.destination}
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: riskColor }} />
            <span className="text-[10px] text-zinc-600 capitalize">{shipment.delay_risk} risk</span>
          </div>
          <div className="mt-1.5 text-[10px] text-zinc-400">ETA: {shipment.eta} min</div>
        </div>
      </div>

      {/* Route legend */}
      <div className="absolute top-3 right-3 z-10">
        <div className="bg-white/90 backdrop-blur rounded-xl p-2.5 border border-zinc-200 shadow">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-5 h-1 rounded-full" style={{ background: approval === 'approved' ? '#9ca3af' : '#22c55e', opacity: approval === 'approved' ? 0.4 : 1 }} />
            <span className="text-[9px] text-zinc-600">Primary</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-1 rounded-full bg-blue-500" style={{ opacity: approval === 'approved' ? 1 : 0.4 }} />
            <span className="text-[9px] text-zinc-600">Alternate</span>
          </div>
        </div>
      </div>

      {/* Reroute approval panel */}
      {showAlert && approval === null && altDirections && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20">
          <div className="bg-white rounded-xl shadow-xl border border-zinc-200 p-3 flex items-center gap-3">
            <div>
              <div className="text-xs font-bold text-zinc-900 mb-0.5">Reroute suggested</div>
              <div className="text-[10px] text-zinc-500">Alternate route avoids risk zone</div>
            </div>
            <button
              onClick={() => setApproval('approved')}
              className="flex items-center gap-1 bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-green-600 transition-all"
            >
              <CheckCircle size={11} /> Approve
            </button>
            <button
              onClick={() => setApproval('rejected')}
              className="flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-red-100 transition-all"
            >
              <XCircle size={11} /> Reject
            </button>
          </div>
        </div>
      )}

      {/* Approval result */}
      {approval !== null && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20">
          <div className={`rounded-xl px-4 py-2.5 text-xs font-bold flex items-center gap-2 shadow-lg ${
            approval === 'approved'
              ? 'bg-green-500 text-white'
              : 'bg-zinc-100 border border-zinc-200 text-zinc-700'
          }`}>
            {approval === 'approved'
              ? <><CheckCircle size={13} /> Reroute approved — alternate route active</>
              : <><XCircle size={13} /> Original route maintained</>}
          </div>
        </div>
      )}

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
        {/* Primary route */}
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true,
              polylineOptions: {
                strokeColor:   approval === 'approved' ? '#9ca3af' : '#22c55e',
                strokeOpacity: approval === 'approved' ? 0.3 : 0.85,
                strokeWeight:  5,
              },
            }}
          />
        )}

        {/* Alternate route */}
        {altDirections && (
          <DirectionsRenderer
            directions={altDirections}
            options={{
              suppressMarkers: true,
              polylineOptions: {
                strokeColor:   '#3b82f6',
                strokeOpacity: approval === 'approved' ? 0.85 : 0.38,
                strokeWeight:  approval === 'approved' ? 5 : 3,
              },
            }}
          />
        )}

        {/* Source marker */}
        {CITY_COORDS[shipment.source] && (
          <OverlayView
            position={CITY_COORDS[shipment.source]}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <div className="-translate-x-1/2 -translate-y-full flex flex-col items-center gap-0.5 pointer-events-none">
              <div className="bg-zinc-900 text-white text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow">
                {shipment.source}
              </div>
              <div className="w-3.5 h-3.5 bg-zinc-900 rounded-full border-2 border-white shadow" />
            </div>
          </OverlayView>
        )}

        {/* Destination marker */}
        {CITY_COORDS[shipment.destination] && (
          <OverlayView
            position={CITY_COORDS[shipment.destination]}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <div className="-translate-x-1/2 -translate-y-full flex flex-col items-center gap-0.5 pointer-events-none">
              <div className="bg-[#EAB308] text-black text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow">
                {shipment.destination}
              </div>
              <div className="w-4 h-4 bg-[#EAB308] rounded-full border-2 border-white shadow flex items-center justify-center">
                <MapPin size={9} className="text-black" />
              </div>
            </div>
          </OverlayView>
        )}

        {/* Animated truck */}
        {truckPos && (
          <OverlayView
            position={truckPos}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <div className="-translate-x-1/2 -translate-y-1/2 relative">
              <div
                className="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
                style={{ background: riskColor }}
              >
                <Truck size={14} className="text-white" />
              </div>
              {shipment.status === 'delayed' && (
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-400 rounded-full border border-white animate-ping" />
              )}
            </div>
          </OverlayView>
        )}
      </GoogleMap>
    </div>
  )
}
