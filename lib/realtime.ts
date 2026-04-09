// Simulated real-time traffic & weather feed
// In production these would come from traffic/weather APIs

export type TrafficLevel = 'low' | 'medium' | 'high'
export type WeatherCondition = 'clear' | 'rain' | 'storm'

// Weighted random — medium traffic is most common
export function getTraffic(): TrafficLevel {
  const r = Math.random()
  if (r < 0.35) return 'low'
  if (r < 0.75) return 'medium'
  return 'high'
}

// Weighted random — clear weather is most common
export function getWeather(): WeatherCondition {
  const r = Math.random()
  if (r < 0.60) return 'clear'
  if (r < 0.85) return 'rain'
  return 'storm'
}

// Derive delay factor from conditions (multiplier on base ETA)
export function getDelayFactor(traffic: TrafficLevel, weather: WeatherCondition): number {
  const t = traffic === 'high' ? 0.30 : traffic === 'medium' ? 0.15 : 0
  const w = weather === 'storm' ? 0.40 : weather === 'rain' ? 0.20 : 0
  return t + w
}

// Derive delay risk from conditions
export function getRiskFromConditions(
  traffic: TrafficLevel,
  weather: WeatherCondition,
  distance: number
): 'low' | 'medium' | 'high' {
  const factor = getDelayFactor(traffic, weather)
  if (factor >= 0.40 || distance > 450) return 'high'
  if (factor >= 0.15 || distance > 250) return 'medium'
  return 'low'
}

// Estimate cost based on vehicle, distance, and traffic
export function estimateCost(
  vehicle: 'Truck' | 'Van' | 'Bike',
  distance: number,
  traffic: TrafficLevel
): number {
  const base = vehicle === 'Truck' ? 18 : vehicle === 'Van' ? 12 : 7
  const trafficMultiplier = traffic === 'high' ? 1.20 : traffic === 'medium' ? 1.10 : 1.0
  return Math.round(distance * base * trafficMultiplier)
}

// Assign vehicle based on weight
export function assignVehicle(weight: number): 'Truck' | 'Van' | 'Bike' {
  if (weight > 70) return 'Truck'
  if (weight > 15) return 'Van'
  return 'Bike'
}

// Assign driver (round-robin style)
const DRIVERS = ['D1', 'D2', 'D3']
let driverIndex = 0
export function assignDriver(): string {
  const d = DRIVERS[driverIndex % DRIVERS.length]
  driverIndex++
  return d
}

// Compute ETA in minutes
export function computeEta(
  distance: number,
  traffic: TrafficLevel,
  weather: WeatherCondition,
  priority: string
): number {
  const base = Math.round((distance / 60) * 60) // assume 60 km/h base speed
  const delay = Math.round(base * getDelayFactor(traffic, weather))
  const priorityAdj = priority === 'high' ? -10 : priority === 'low' ? 10 : 0
  return Math.max(base + delay + priorityAdj, 10)
}

// Scheduled delivery time string
export function getScheduledDelivery(etaMinutes: number): string {
  const d = new Date(Date.now() + etaMinutes * 60 * 1000)
  return d.toLocaleString('en-IN', {
    hour: '2-digit', minute: '2-digit',
    day: '2-digit', month: 'short',
  })
}

// Traffic label with color hint
export const TRAFFIC_META: Record<TrafficLevel, { label: string; color: string }> = {
  low:    { label: 'Low',    color: '#22c55e' },
  medium: { label: 'Medium', color: '#eab308' },
  high:   { label: 'High',   color: '#ef4444' },
}

export const WEATHER_META: Record<WeatherCondition, { label: string; emoji: string }> = {
  clear: { label: 'Clear',  emoji: '☀️' },
  rain:  { label: 'Rain',   emoji: '🌧️' },
  storm: { label: 'Storm',  emoji: '⛈️' },
}
