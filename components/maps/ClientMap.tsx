'use client'
import { useState, useCallback, useEffect, useRef } from 'react'
import { GoogleMap, useJsApiLoader, OverlayView, DirectionsRenderer } from '@react-google-maps/api'
import { Shipment } from '@/lib/firestore'
import { CITY_COORDS, SHIPMENT_PROGRESS } from '@/lib/mapData'
import { AlertTriangle, Clock, MapPin, Package, Truck } from 'lucide-react'

const MAP_STYLES = [
  { featureType: 'poi',     elementType: 'labels',         stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'labels',         stylers: [{ visibility: 'off' }] },
  { featureType: 'water',   elementType: 'geometry.fill',  stylers: [{ color: '#bfdbfe' }] },
  { featureType: 'landscape', elementType: 'geometry.fill', stylers: [{ color: '#f0f9ff' }] },
]

const STATUS_META: Record<string, { label: string; color: string; bg: string; routeColor: string }> = {
  in_transit: { label: 'In Transit',  color: 'text-blue-700',  bg: 'bg-blue-100',  routeColor: '#3b82f6' },
  delayed:    { label: 'Delayed',     color: 'text-red-700',   bg: 'bg-red-100',   routeColor: '#ef4444' },
  pending:    { label: 'Preparing',   color: 'text-zinc-600',  bg: 'bg-zinc-100',  routeColor: '#6b7280' },
  delivered:  { label: 'Delivered',   color: 'text-green-700', bg: 'bg-green-100', routeColor: '#22c55e' },
}

interface ClientMapProps {
  shipment: Shipment
}

export default function ClientMap({ shipment }: ClientMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  })

  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null)
  const [truckPos,   setTruckPos]   = useState<{ lat: number; lng: number } | null>(null)
  const [etaText,    setEtaText]    = useState('')
  const [distText,   setDistText]   = useState('')
  const routePath   = useRef<Array<{ lat: number; lng: number }>>([])
  const progressRef = useRef(SHIPMENT_PROGRESS[shipment.id!] ?? 0.38)
  const prevId      = useRef<string | null>(null)
  const animRef     = useRef<ReturnType<typeof setInterval> | null>(null)

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
        const leg = result.routes[0].legs[0]
        if (leg.duration) setEtaText(leg.duration.text)
        if (leg.distance) setDistText(leg.distance.text)
      }
    )
  }, [shipment])

  useEffect(() => {
    if (!isLoaded) return
    if (prevId.current === shipment.id) return
    prevId.current = shipment.id || null

    setDirections(null)
    setTruckPos(null)
    setEtaText('')
    setDistText('')
    progressRef.current = SHIPMENT_PROGRESS[shipment.id!] ?? 0.38
    routePath.current = []

    fetchRoute()
  }, [isLoaded, shipment, fetchRoute])

  // Slow truck animation
  useEffect(() => {
    if (animRef.current) clearInterval(animRef.current)
    if (!routePath.current.length || shipment.status === 'delivered') return

    animRef.current = setInterval(() => {
      progressRef.current = Math.min(progressRef.current + 0.0008, 0.99)
      const idx = Math.floor(progressRef.current * (routePath.current.length - 1))
      if (routePath.current[idx]) setTruckPos(routePath.current[idx])
    }, 1000)

    return () => { if (animRef.current) clearInterval(animRef.current) }
  }, [directions, shipment.status])

  const center = (() => {
    const src = CITY_COORDS[shipment.source]
    const dst = CITY_COORDS[shipment.destination]
    if (src && dst) return { lat: (src.lat + dst.lat) / 2, lng: (src.lng + dst.lng) / 2 }
    return { lat: 15.0, lng: 78.0 }
  })()

  const meta = STATUS_META[shipment.status] || STATUS_META.pending

  if (loadError) return (
    <div className="h-72 flex items-center justify-center bg-red-50 border border-red-200 rounded-2xl">
      <AlertTriangle className="text-red-500 mr-2" size={18} />
      <span className="text-red-600 text-sm">Map unavailable</span>
    </div>
  )

  if (!isLoaded) return (
    <div className="h-72 flex items-center justify-center bg-blue-50 rounded-2xl animate-pulse">
      <Package className="text-blue-300 mr-2" size={22} />
      <span className="text-blue-400 text-sm">Loading tracking map…</span>
    </div>
  )

  return (
    <div className="relative w-full h-72 rounded-2xl overflow-hidden border border-zinc-200">

      {/* Status bar */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
        <div className="flex items-center gap-2.5 bg-white/95 backdrop-blur rounded-xl shadow-lg border border-zinc-200 px-3.5 py-2">
          <Package size={13} className="text-zinc-500" />
          <span className="text-xs font-bold text-zinc-800">{shipment.id}</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>
            {meta.label}
          </span>
          {etaText && (
            <div className="flex items-center gap-1 text-xs text-zinc-400 border-l border-zinc-200 pl-2">
              <Clock size={11} />
              <span>~{etaText}</span>
            </div>
          )}
          {distText && (
            <span className="text-xs text-zinc-400">{distText}</span>
          )}
        </div>
      </div>

      {/* Route labels */}
      <div className="absolute bottom-3 left-3 z-10">
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur rounded-xl px-3 py-1.5 border border-zinc-200 shadow text-xs">
          <div className="w-2 h-2 rounded-full bg-zinc-800" />
          <span className="text-zinc-700 font-medium">{shipment.source}</span>
          <span className="text-zinc-300 mx-0.5">→</span>
          <div className="w-2 h-2 rounded-full bg-[#EAB308]" />
          <span className="text-zinc-700 font-medium">{shipment.destination}</span>
        </div>
      </div>

      {/* No internal data note */}
      <div className="absolute bottom-3 right-3 z-10">
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1.5">
          <span className="text-[9px] text-blue-600 font-medium">Live tracking only</span>
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
          gestureHandling: 'cooperative',
        }}
      >
        {/* Route */}
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true,
              polylineOptions: {
                strokeColor:   meta.routeColor,
                strokeOpacity: 0.8,
                strokeWeight:  5,
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
            <div className="-translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <div className="w-5 h-5 bg-[#EAB308] rounded-full border-2 border-white shadow flex items-center justify-center">
                <MapPin size={10} className="text-black" />
              </div>
            </div>
          </OverlayView>
        )}

        {/* Truck */}
        {truckPos && shipment.status !== 'delivered' && (
          <OverlayView
            position={truckPos}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <div className="-translate-x-1/2 -translate-y-1/2 relative pointer-events-none">
              <div
                className="w-9 h-9 rounded-full border-2 border-white shadow-xl flex items-center justify-center"
                style={{ background: meta.routeColor }}
              >
                <Truck size={15} className="text-white" />
              </div>
              {shipment.status === 'delayed' && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-400 rounded-full border-2 border-white flex items-center justify-center animate-pulse">
                  <span className="text-[8px] text-white font-bold">!</span>
                </div>
              )}
            </div>
          </OverlayView>
        )}

        {/* Delivered checkmark */}
        {shipment.status === 'delivered' && CITY_COORDS[shipment.destination] && (
          <OverlayView
            position={CITY_COORDS[shipment.destination]}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <div className="-translate-x-1/2 -translate-y-full flex flex-col items-center gap-1 pointer-events-none">
              <div className="bg-green-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow whitespace-nowrap">
                ✓ Delivered
              </div>
              <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow" />
            </div>
          </OverlayView>
        )}
      </GoogleMap>
    </div>
  )
}
