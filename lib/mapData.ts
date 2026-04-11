// Coordinates for major Indian cities used in mock shipments
export const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  'Bangalore': { lat: 12.9716, lng: 77.5946 },
  'Chennai': { lat: 13.0827, lng: 80.2707 },
  'Mumbai': { lat: 19.0760, lng: 72.8777 },
  'Pune': { lat: 18.5204, lng: 73.8567 },
  'Delhi': { lat: 28.6139, lng: 77.2090 },
  'Agra': { lat: 27.1767, lng: 78.0081 },
  'Hyderabad': { lat: 17.3850, lng: 78.4867 },
  'Vijayawada': { lat: 16.5062, lng: 80.6480 },
  'Kolkata': { lat: 22.5726, lng: 88.3639 },
  'Bhubaneswar': { lat: 20.2961, lng: 85.8245 },
  'Ahmedabad': { lat: 23.0225, lng: 72.5714 },
  'Jaipur': { lat: 26.9124, lng: 75.7873 },
  'Surat': { lat: 21.1702, lng: 72.8311 },
  'Lucknow': { lat: 26.8467, lng: 80.9462 },
  'Nagpur': { lat: 21.1458, lng: 79.0882 },
}

export const INDIA_CENTER = { lat: 20.5937, lng: 78.9629 }

export type RiskZoneType = 'crime' | 'traffic' | 'crisis' | 'flood' | 'strike'

export interface RiskZone {
  id: string
  label: string
  type: RiskZoneType
  path: Array<{ lat: number; lng: number }>
}

// Static risk zones visible on Admin map as polygons
export const STATIC_RISK_ZONES: RiskZone[] = [
  {
    id: 'crime-1', label: 'Crime Zone — Agra Corridor', type: 'crime',
    path: [
      { lat: 27.5, lng: 77.7 }, { lat: 27.7, lng: 78.0 },
      { lat: 27.4, lng: 78.2 }, { lat: 27.2, lng: 77.9 },
    ],
  },
  {
    id: 'crime-2', label: 'Crime Zone — NH-44 Stretch', type: 'crime',
    path: [
      { lat: 12.5, lng: 79.0 }, { lat: 12.8, lng: 79.3 },
      { lat: 12.6, lng: 79.5 }, { lat: 12.3, lng: 79.2 },
    ],
  },
  {
    id: 'traffic-1', label: 'High Traffic — Mumbai Expressway', type: 'traffic',
    path: [
      { lat: 18.65, lng: 73.2 }, { lat: 18.85, lng: 73.45 },
      { lat: 18.7, lng: 73.65 }, { lat: 18.5, lng: 73.4 },
    ],
  },
  {
    id: 'crisis-1', label: 'Cyclone Warning — Coastal Odisha', type: 'crisis',
    path: [
      { lat: 19.9, lng: 85.4 }, { lat: 20.3, lng: 85.9 },
      { lat: 20.1, lng: 86.3 }, { lat: 19.7, lng: 85.9 },
    ],
  },
]

// Simulated crisis zones (added via Admin panel)
export const FLOOD_ZONE: RiskZone = {
  id: 'sim-flood-1', label: 'Simulated Flood — Mumbai Region', type: 'flood',
  path: [
    { lat: 19.1, lng: 72.7 }, { lat: 19.3, lng: 72.95 },
    { lat: 19.15, lng: 73.1 }, { lat: 18.95, lng: 72.9 },
  ],
}

export const STRIKE_ZONE: RiskZone = {
  id: 'sim-strike-1', label: 'Simulated Strike — Delhi Hub', type: 'strike',
  path: [
    { lat: 28.5, lng: 77.0 }, { lat: 28.7, lng: 77.2 },
    { lat: 28.6, lng: 77.4 }, { lat: 28.4, lng: 77.2 },
  ],
}

// Colors for each risk zone type
export const RISK_ZONE_COLORS: Record<RiskZoneType, { fill: string; stroke: string }> = {
  crime:   { fill: '#ef4444', stroke: '#dc2626' },
  traffic: { fill: '#f97316', stroke: '#ea580c' },
  crisis:  { fill: '#8b5cf6', stroke: '#7c3aed' },
  flood:   { fill: '#3b82f6', stroke: '#2563eb' },
  strike:  { fill: '#eab308', stroke: '#ca8a04' },
}

// Simulated progress along route (0 = at source, 1 = at destination)
export const SHIPMENT_PROGRESS: Record<string, number> = {
  S1: 0.45,
  S2: 1.0,
  S3: 0.22,
  S4: 0.0,
  S5: 0.60,
}

// Interpolate between two coordinates
export function interpolate(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  fraction: number
): { lat: number; lng: number } {
  return {
    lat: from.lat + (to.lat - from.lat) * fraction,
    lng: from.lng + (to.lng - from.lng) * fraction,
  }
}

export const ANIMAL_CATEGORIES: Record<string, any[]> = {
  'Pets (Companion)': [
    { value: 'dog', label: 'Dog', emoji: '🐕', desc: 'Canis familiaris' },
    { value: 'cat', label: 'Cat', emoji: '🐈', desc: 'Felis catus' },
    { value: 'rabbit', label: 'Rabbit', emoji: '🐇', desc: 'Lagomorpha' }
  ],
  'Livestock': [
    { value: 'cow', label: 'Cow', emoji: '🐄', desc: 'Bos taurus' },
    { value: 'goat', label: 'Goat', emoji: '🐐', desc: 'Capra hircus' },
    { value: 'sheep', label: 'Sheep', emoji: '🐑', desc: 'Ovis aries' },
    { value: 'pig', label: 'Pig', emoji: '🐖', desc: 'Sus domesticus' },
  ],
  'Poultry': [
    { value: 'chicken', label: 'Chicken', emoji: '🐔', desc: 'Gallus gallus' },
    { value: 'duck', label: 'Duck', emoji: '🦆', desc: 'Anatidae' },
    { value: 'turkey', label: 'Turkey', emoji: '🦃', desc: 'Meleagris' },
  ],
  'Exotic Animals': [
    { value: 'reptile', label: 'Reptile', emoji: '🦎', desc: 'Reptilia' },
    { value: 'bird', label: 'Bird', emoji: '🦜', desc: 'Aves' },
    { value: 'amphibian', label: 'Amphibian', emoji: '🐸', desc: 'Amphibia' },
  ],
  'Aquatic Animals': [
    { value: 'fish', label: 'Fish', emoji: '🐟', desc: 'Pisces' },
    { value: 'shrimp', label: 'Shrimp', emoji: '🦐', desc: 'Caridea' },
    { value: 'ornamental', label: 'Ornamental', emoji: '🐠', desc: 'Aquarium Specs' },
  ],
  'Zoo/Wild (Permits)': [
    { value: 'lion', label: 'Lion', emoji: '🦁', desc: 'Panthera leo' },
    { value: 'elephant', label: 'Elephant', emoji: '🐘', desc: 'Elephantidae' },
    { value: 'tiger', label: 'Tiger', emoji: '🐅', desc: 'Panthera tigris' },
  ]
};
