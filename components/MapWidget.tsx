'use client'
import { useState, useCallback, useEffect } from 'react'
import { GoogleMap, useJsApiLoader, OverlayView, Polyline } from '@react-google-maps/api'
import { MapPin, Navigation, Truck, AlertTriangle } from 'lucide-react'

// You must add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file
const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '0.75rem'
};

const mapStyles = [
  { featureType: "all", elementType: "labels.text.fill", stylers: [{ color: "#7c93a3" }, { lightness: "-10" }] },
  { featureType: "administrative.country", elementType: "geometry", stylers: [{ visibility: "on" }] },
  { featureType: "administrative.country", elementType: "geometry.stroke", stylers: [{ color: "#a0aab1" }] },
  { featureType: "water", elementType: "geometry.fill", stylers: [{ color: "#e1e6e9" }] }
]

interface MapWidgetProps {
  center: { lat: number; lng: number }
  zoom?: number
  markers?: Array<{ id: string; lat: number; lng: number; type: 'origin'|'destination'|'driver', label?: string }>
  route?: Array<{ lat: number; lng: number }>
  alternativeRoute?: Array<{ lat: number; lng: number }>
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH'
  className?: string
}

export default function MapWidget({ center, zoom = 10, markers = [], route = [], alternativeRoute = [], riskLevel, className = 'h-96' }: MapWidgetProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  });

  const [map, setMap] = useState<google.maps.Map | null>(null)

  const onLoad = useCallback(function callback(mapInstance: google.maps.Map) {
    if (markers.length > 0) {
      const bounds = new window.google.maps.LatLngBounds()
      markers.forEach(m => bounds.extend({ lat: m.lat, lng: m.lng }))
      route.forEach(r => bounds.extend(r))
      mapInstance.fitBounds(bounds)
    }
    setMap(mapInstance)
  }, [markers, route])

  const onUnmount = useCallback(function callback() {
    setMap(null)
  }, [])

  if (loadError) {
    return <div className={`flex flex-col items-center justify-center bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 ${className}`}><AlertTriangle className="mb-2" />Error loading Maps. Check API Key.</div>
  }

  if (!isLoaded) {
    return <div className={`flex flex-col items-center justify-center bg-zinc-50 border border-zinc-200 text-zinc-400 rounded-xl p-4 animate-pulse ${className}`}><MapPin className="mb-2" />Loading Map Data...</div>
  }

  return (
    <div className={`relative w-full overflow-hidden ${className}`}>
      {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
        <div className="absolute top-2 left-2 right-2 z-10 bg-amber-50 border border-amber-200 text-amber-700 text-xs px-3 py-2 rounded-lg font-bold flex items-center justify-between shadow-sm">
          <span>⚠️ Missing API Key: Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local</span>
        </div>
      )}
      
      <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={zoom} onLoad={onLoad} onUnmount={onUnmount} options={{
        styles: mapStyles, disableDefaultUI: true, zoomControl: true
      }}>
        
        {route.length > 0 && (
           <Polyline path={route} options={{ strokeColor: riskLevel === 'HIGH' ? '#ef4444' : riskLevel === 'MEDIUM' ? '#eab308' : '#22c55e', strokeOpacity: 0.8, strokeWeight: 5 }} />
        )}

        {alternativeRoute.length > 0 && (
          <Polyline path={alternativeRoute} options={{ strokeColor: '#3b82f6', strokeOpacity: 0.6, strokeWeight: 4 }} />
        )}

        {markers.map(m => (
          <OverlayView key={m.id} position={{ lat: m.lat, lng: m.lng }} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
            <div className="-translate-x-1/2 -translate-y-1/2 flex flex-col items-center drop-shadow-md">
              {m.label && <div className="bg-white text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 border border-zinc-200">{m.label}</div>}
              {m.type === 'origin' && <div className="w-6 h-6 bg-zinc-900 rounded-full flex items-center justify-center text-white border-2 border-white"><MapPin size={12}/></div>}
              {m.type === 'destination' && <div className="w-6 h-6 bg-brand-yellow rounded-full flex items-center justify-center text-black border-2 border-white"><MapPin size={12}/></div>}
              {m.type === 'driver' && <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white border-2 border-white"><Truck size={14}/></div>}
            </div>
          </OverlayView>
        ))}
      </GoogleMap>

       {riskLevel && (
        <div className="absolute bottom-4 left-4 z-10 bg-white/90 backdrop-blur border border-zinc-200 text-xs px-4 py-3 rounded-xl shadow-lg font-bold flex flex-col gap-1 w-64">
           <div className="flex items-center justify-between mb-1">
             <span className="text-zinc-500">Route Analysis</span>
             <span className={`px-2 py-0.5 rounded-full ${riskLevel === 'HIGH' ? 'bg-red-100 text-red-700' : riskLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                {riskLevel} RISK
             </span>
           </div>
           {riskLevel === 'HIGH' && alternativeRoute.length > 0 && (
             <div className="text-blue-600 bg-blue-50 p-2 rounded-lg mt-1 border border-blue-100 flex items-start gap-2">
               <Navigation size={14} className="shrink-0 mt-0.5" />
               <p className="leading-tight text-[10px]">Alternative safe route calculated. Distance increased by 14km to avoid hazard zones.</p>
             </div>
           )}
        </div>
      )}
    </div>
  )
}
