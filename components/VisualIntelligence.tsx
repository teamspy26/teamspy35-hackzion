'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { GoogleMap, useJsApiLoader, DirectionsRenderer, OverlayView } from '@react-google-maps/api'
import { CITY_COORDS } from '@/lib/mapData'
import {
  AlertTriangle, Camera, CheckCircle, Clock, Navigation,
  Play, Pause, RefreshCw, Truck, Video, Wifi, Zap, MapPin,
} from 'lucide-react'

const MAP_STYLES = [
  { featureType: 'poi',   elementType: 'labels',         stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry.fill',  stylers: [{ color: '#dbeafe' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#e5e7eb' }] },
]

type Detection = 'clear' | 'traffic' | 'accident'

interface Alert {
  id: string
  type: 'traffic' | 'accident' | 'clear'
  title: string
  message: string
  time: string
  color: string
  bg: string
}

/** Derive detection type from video currentTime (seconds) */
function detectFromTime(t: number): Detection {
  if (t >= 18 && t < 28) return 'accident'
  if (t >= 8  && t < 18) return 'traffic'
  return 'clear'
}

interface VisualIntelligenceProps {
  source?: string
  destination?: string
}

export default function VisualIntelligence({
  source      = 'Bangalore',
  destination = 'Chennai',
}: VisualIntelligenceProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  })

  // Map state
  const [primaryDir, setPrimaryDir] = useState<google.maps.DirectionsResult | null>(null)
  const [altDir,     setAltDir]     = useState<google.maps.DirectionsResult | null>(null)
  const [useAlt,     setUseAlt]     = useState(false)
  const [truckPos,   setTruckPos]   = useState<{ lat: number; lng: number } | null>(null)
  const routePathRef = useRef<Array<{ lat: number; lng: number }>>([])
  const altPathRef   = useRef<Array<{ lat: number; lng: number }>>([])
  const progressRef  = useRef(0.2)
  const animRef      = useRef<ReturnType<typeof setInterval> | null>(null)

  // Video state
  const videoRef   = useRef<HTMLVideoElement>(null)
  const [playing,  setPlaying]  = useState(false)
  const [elapsed,  setElapsed]  = useState(0)
  const [duration, setDuration] = useState(0)

  // Detection state
  const [detection, setDetection]   = useState<Detection>('clear')
  const detectionRef                 = useRef<Detection>('clear')  // ref copy to avoid stale closure in side effects
  const [etaExtra,  setEtaExtra]    = useState(0)        // minutes added due to traffic
  const [baseEta]                    = useState(120)       // mock base ETA
  const [alerts,    setAlerts]      = useState<Alert[]>([])
  const [detecting, setDetecting]   = useState(false)    // "AI scanning" indicator
  const alertIdRef                   = useRef(0)           // monotonic counter for unique alert IDs

  // Fetch routes when Maps loads
  const fetchRoutes = useCallback(() => {
    if (!window.google) return
    const svc = new window.google.maps.DirectionsService()

    svc.route(
      { origin: `${source}, India`, destination: `${destination}, India`, travelMode: window.google.maps.TravelMode.DRIVING },
      (result, status) => {
        if (status !== 'OK' || !result) return
        setPrimaryDir(result)
        const path: Array<{ lat: number; lng: number }> = []
        result.routes[0].overview_path.forEach(p => path.push({ lat: p.lat(), lng: p.lng() }))
        routePathRef.current = path
        const idx = Math.floor(progressRef.current * (path.length - 1))
        if (path[idx]) setTruckPos(path[idx])
      }
    )

    svc.route(
      { origin: `${source}, India`, destination: `${destination}, India`, travelMode: window.google.maps.TravelMode.DRIVING, avoidHighways: true },
      (result, status) => {
        if (status !== 'OK' || !result) return
        setAltDir(result)
        const path: Array<{ lat: number; lng: number }> = []
        result.routes[0].overview_path.forEach(p => path.push({ lat: p.lat(), lng: p.lng() }))
        altPathRef.current = path
      }
    )
  }, [source, destination])

  useEffect(() => { if (isLoaded) fetchRoutes() }, [isLoaded, fetchRoutes])

  // Animate truck
  useEffect(() => {
    if (animRef.current) clearInterval(animRef.current)
    const activePath = useAlt ? altPathRef.current : routePathRef.current
    if (!activePath.length) return

    animRef.current = setInterval(() => {
      const speed = useAlt ? 0.003 : detection === 'traffic' ? 0.001 : detection === 'accident' ? 0 : 0.003
      progressRef.current = Math.min(progressRef.current + speed, 0.99)
      const path = useAlt ? altPathRef.current : routePathRef.current
      const idx  = Math.floor(progressRef.current * (path.length - 1))
      if (path[idx]) setTruckPos(path[idx])
    }, 600)

    return () => { if (animRef.current) clearInterval(animRef.current) }
  }, [primaryDir, altDir, useAlt, detection])

  // Video time tracking + detection logic
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onTimeUpdate = () => {
      const t = video.currentTime
      setElapsed(t)
      setDuration(video.duration || 0)

      const newDetection = detectFromTime(t)
      const prev = detectionRef.current
      if (prev === newDetection) return

      // Update refs and state (side effects OUTSIDE the updater to avoid Strict Mode double-invoke)
      detectionRef.current = newDetection
      setDetection(newDetection)
      setDetecting(true)
      setTimeout(() => setDetecting(false), 1200)

      const nextId = () => `alert-${++alertIdRef.current}`
      const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

      if (newDetection === 'traffic') {
        const extra = 18
        setEtaExtra(e => e + extra)
        setAlerts(a => [{
          id: nextId(),
          type: 'traffic',
          title: '🚦 High Traffic Detected',
          message: `AI camera detected heavy congestion on route. ETA increased by ${extra} minutes. Reducing speed recommended.`,
          time: now,
          color: 'text-orange-700',
          bg:    'bg-orange-50 border-orange-200',
        }, ...a.slice(0, 4)])
      }

      if (newDetection === 'accident') {
        setUseAlt(true)
        progressRef.current = Math.max(progressRef.current - 0.05, 0.1)
        setAlerts(a => [{
          id: nextId(),
          type: 'accident',
          title: '🚨 Accident Detected',
          message: 'AI camera detected a road accident ahead. Route automatically changed to alternate highway. Truck rerouting now.',
          time: now,
          color: 'text-red-700',
          bg:    'bg-red-50 border-red-200',
        }, ...a.slice(0, 4)])
      }

      if (newDetection === 'clear') {
        setUseAlt(false)
        setAlerts(a => [{
          id: nextId(),
          type: 'clear',
          title: '✅ Route Cleared',
          message: 'Road ahead is clear. Resuming optimal route at normal speed.',
          time: now,
          color: 'text-green-700',
          bg:    'bg-green-50 border-green-200',
        }, ...a.slice(0, 4)])
      }

    }

    video.addEventListener('timeupdate', onTimeUpdate)
    return () => video.removeEventListener('timeupdate', onTimeUpdate)
  }, [])

  const togglePlay = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) { v.play(); setPlaying(true) }
    else { v.pause(); setPlaying(false) }
  }

  const resetVideo = () => {
    const v = videoRef.current
    if (!v) return
    v.currentTime = 0
    v.pause()
    setPlaying(false)
    setDetection('clear')
    setEtaExtra(0)
    setUseAlt(false)
    setAlerts([])
    progressRef.current = 0.2
  }

  const mapCenter = (() => {
    const s = CITY_COORDS[source], d = CITY_COORDS[destination]
    return s && d ? { lat: (s.lat + d.lat) / 2, lng: (s.lng + d.lng) / 2 } : { lat: 15, lng: 78 }
  })()

  const detectionStatusConfig = {
    clear:    { label: 'Route Clear',       color: 'text-green-600',  bg: 'bg-green-50  border-green-200',  pulse: 'bg-green-500'  },
    traffic:  { label: 'Traffic Detected',  color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200', pulse: 'bg-orange-500' },
    accident: { label: 'Accident Detected', color: 'text-red-600',    bg: 'bg-red-50    border-red-200',    pulse: 'bg-red-500'    },
  }
  const dsc = detectionStatusConfig[detection]

  const pct = duration > 0 ? (elapsed / duration) * 100 : 0

  return (
    <div className="space-y-4">

      {/* ── Top row: Map (left) + Video (right) ── */}
      <div className="grid grid-cols-12 gap-4">

        {/* Map */}
        <div className="col-span-7">
          <div className="relative w-full h-72 rounded-2xl overflow-hidden border border-zinc-200">

            {/* Route label */}
            <div className="absolute top-3 left-3 z-10">
              <div className="bg-white/95 backdrop-blur rounded-xl shadow border border-zinc-200 px-3 py-2">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-0.5">
                  {useAlt ? '🔀 Alternate Route' : '✅ Primary Route'}
                </div>
                <div className="text-xs font-semibold text-zinc-800">{source} → {destination}</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">
                  ETA: ~{baseEta + etaExtra} min
                  {etaExtra > 0 && <span className="text-orange-600 ml-1">+{etaExtra} min delay</span>}
                </div>
              </div>
            </div>

            {/* Reroute notification */}
            {useAlt && (
              <div className="absolute top-3 right-3 z-10">
                <div className="bg-red-600 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-xl shadow flex items-center gap-1.5 animate-pulse">
                  <RefreshCw size={10} /> Rerouted
                </div>
              </div>
            )}

            {!isLoaded ? (
              <div className="h-full flex items-center justify-center bg-zinc-50 animate-pulse">
                <MapPin className="text-zinc-300 mr-2" size={20} />
                <span className="text-zinc-400 text-sm">Loading map…</span>
              </div>
            ) : (
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={mapCenter}
                zoom={7}
                options={{ styles: MAP_STYLES, disableDefaultUI: true, zoomControl: true }}
              >
                {/* Primary route */}
                {primaryDir && (
                  <DirectionsRenderer
                    directions={primaryDir}
                    options={{
                      suppressMarkers: true,
                      polylineOptions: {
                        strokeColor:   useAlt ? '#d1d5db' : detection === 'accident' ? '#ef4444' : '#22c55e',
                        strokeOpacity: useAlt ? 0.3 : 0.85,
                        strokeWeight:  5,
                      },
                    }}
                  />
                )}

                {/* Alternate route */}
                {altDir && (
                  <DirectionsRenderer
                    directions={altDir}
                    options={{
                      suppressMarkers: true,
                      polylineOptions: {
                        strokeColor:   '#3b82f6',
                        strokeOpacity: useAlt ? 0.85 : 0.25,
                        strokeWeight:  useAlt ? 5 : 3,
                      },
                    }}
                  />
                )}

                {/* Source marker */}
                {CITY_COORDS[source] && (
                  <OverlayView position={CITY_COORDS[source]} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
                    <div className="-translate-x-1/2 -translate-y-1/2 pointer-events-none">
                      <div className="w-3 h-3 bg-zinc-800 rounded-full border-2 border-white shadow" />
                    </div>
                  </OverlayView>
                )}

                {/* Destination marker */}
                {CITY_COORDS[destination] && (
                  <OverlayView position={CITY_COORDS[destination]} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
                    <div className="-translate-x-1/2 -translate-y-1/2 pointer-events-none">
                      <div className="w-4 h-4 bg-[#EAB308] rounded-full border-2 border-white shadow flex items-center justify-center">
                        <MapPin size={9} className="text-black" />
                      </div>
                    </div>
                  </OverlayView>
                )}

                {/* Truck */}
                {truckPos && (
                  <OverlayView position={truckPos} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
                    <div className="-translate-x-1/2 -translate-y-1/2 pointer-events-none">
                      <div className={`w-9 h-9 rounded-full border-2 border-white shadow-xl flex items-center justify-center ${
                        detection === 'accident' ? 'bg-red-500' :
                        detection === 'traffic'  ? 'bg-orange-500' : 'bg-blue-500'
                      }`}>
                        <Truck size={15} className="text-white" />
                      </div>
                      {detection !== 'clear' && (
                        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border border-white animate-ping"
                          style={{ background: detection === 'accident' ? '#ef4444' : '#f97316' }} />
                      )}
                    </div>
                  </OverlayView>
                )}
              </GoogleMap>
            )}
          </div>
        </div>

        {/* Video panel */}
        <div className="col-span-5">
          <div className="relative h-72 rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-900">

            {/* AI detection overlay */}
            {detecting && (
              <div className="absolute inset-0 z-10 pointer-events-none">
                <div className="absolute top-2 left-2 right-2 bg-black/70 rounded-lg px-3 py-1.5 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-ping" />
                  <span className="text-green-400 text-[10px] font-bold tracking-wide">AI SCANNING…</span>
                </div>
                {/* Corner scan lines */}
                <div className="absolute top-8 left-4 w-6 h-6 border-l-2 border-t-2 border-green-400 opacity-70" />
                <div className="absolute top-8 right-4 w-6 h-6 border-r-2 border-t-2 border-green-400 opacity-70" />
                <div className="absolute bottom-14 left-4 w-6 h-6 border-l-2 border-b-2 border-green-400 opacity-70" />
                <div className="absolute bottom-14 right-4 w-6 h-6 border-r-2 border-b-2 border-green-400 opacity-70" />
              </div>
            )}

            {/* Detection badge */}
            <div className={`absolute top-2 right-2 z-10 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold ${dsc.bg} ${dsc.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${dsc.pulse} ${detection !== 'clear' ? 'animate-pulse' : ''}`} />
              {dsc.label}
            </div>

            {/* Video */}
            <video
              ref={videoRef}
              src="/traffic.mp4"
              className="w-full h-full object-cover"
              loop
              muted
              playsInline
            />

            {/* Video controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-2.5">
              <div className="flex items-center gap-2 mb-2">
                {/* Progress bar */}
                <div className="flex-1 bg-white/20 rounded-full h-1 cursor-pointer"
                  onClick={e => {
                    const v = videoRef.current
                    if (!v || !duration) return
                    const rect = e.currentTarget.getBoundingClientRect()
                    const fraction = (e.clientX - rect.left) / rect.width
                    v.currentTime = fraction * duration
                  }}
                >
                  <div className="h-1 rounded-full bg-[#EAB308] transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[9px] text-white/60 font-mono w-8 text-right">
                  {Math.floor(elapsed)}s
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={togglePlay}
                  className="w-6 h-6 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all">
                  {playing ? <Pause size={11} className="text-white" /> : <Play size={11} className="text-white" />}
                </button>
                <button onClick={resetVideo}
                  className="w-6 h-6 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all">
                  <RefreshCw size={10} className="text-white" />
                </button>
                <div className="flex items-center gap-1 ml-1">
                  <Video size={10} className="text-white/60" />
                  <span className="text-[9px] text-white/60">traffic.mp4 — AI Visual Feed</span>
                </div>
                <div className="ml-auto flex items-center gap-1">
                  <Camera size={10} className="text-green-400" />
                  <span className="text-[9px] text-green-400 font-bold">LIVE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Detection timeline legend ── */}
      <div className="flex items-center gap-3 px-1">
        <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wide">Detection timeline:</span>
        {[
          { label: '0–8s: Clear',          color: 'bg-green-500'  },
          { label: '8–18s: Traffic',        color: 'bg-orange-500' },
          { label: '18–28s: Accident→Reroute', color: 'bg-red-500' },
          { label: '28s+: Clear',           color: 'bg-green-500'  },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${item.color}`} />
            <span className="text-[10px] text-zinc-500">{item.label}</span>
          </div>
        ))}
      </div>

      {/* ── Alert feed ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center">
            <AlertTriangle size={13} className="text-red-600" />
          </div>
          <h3 className="font-bold text-[#111111] text-sm">AI Detection Alerts</h3>
          {alerts.length > 0 && (
            <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full ml-auto">
              {alerts.length} alert{alerts.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {alerts.length === 0 ? (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <CheckCircle size={16} className="text-green-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-800">No alerts detected</p>
              <p className="text-xs text-green-600">Play the video to start AI road analysis</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map(alert => (
              <div key={alert.id} className={`rounded-xl p-3 border ${alert.bg} flex items-start gap-3`}>
                <div className="shrink-0 mt-0.5">
                  {alert.type === 'accident' ? <AlertTriangle size={15} className="text-red-600" /> :
                   alert.type === 'traffic'  ? <Clock         size={15} className="text-orange-600" /> :
                                               <CheckCircle  size={15} className="text-green-600" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`text-sm font-bold ${alert.color}`}>{alert.title}</span>
                    <span className="text-[10px] text-zinc-400">{alert.time}</span>
                  </div>
                  <p className="text-xs text-zinc-700 leading-relaxed">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── How it works ── */}
      <div className="grid grid-cols-4 gap-3 pt-1">
        {[
          { icon: <Video size={14} className="text-blue-500" />,   bg: 'bg-blue-50 border-blue-100',   title: 'Video Input',      desc: 'Real-time traffic.mp4 feed analysed frame-by-frame' },
          { icon: <Camera size={14} className="text-purple-500" />, bg: 'bg-purple-50 border-purple-100', title: 'AI Detection',  desc: 'Simulated CV model detects congestion & accidents' },
          { icon: <AlertTriangle size={14} className="text-orange-500" />, bg: 'bg-orange-50 border-orange-100', title: 'Smart Alerts', desc: 'Instant ETA updates & reroute triggers on detection' },
          { icon: <Navigation size={14} className="text-green-500" />, bg: 'bg-green-50 border-green-100',   title: 'Auto Reroute',  desc: 'Google Maps switches to alternate route on accident' },
        ].map(s => (
          <div key={s.title} className={`rounded-xl p-3 border ${s.bg} flex items-start gap-2.5`}>
            <div className="mt-0.5 shrink-0">{s.icon}</div>
            <div>
              <div className="text-xs font-bold text-zinc-800 mb-0.5">{s.title}</div>
              <div className="text-[10px] text-zinc-500 leading-relaxed">{s.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
