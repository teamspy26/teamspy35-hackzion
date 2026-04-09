/**
 * Crime data based on NCRB (National Crime Records Bureau) Indian Crimes Dataset
 * Scores normalised to 1–10 scale (higher = more crime)
 * Source: Kaggle – adwaitpurao/indian-crimes-dataset
 */

export const STATE_CRIME_SCORES: Record<string, number> = {
  'Delhi':             8.8,
  'Rajasthan':         7.2,
  'Madhya Pradesh':    7.8,
  'Uttar Pradesh':     6.8,
  'Bihar':             6.5,
  'Jharkhand':         6.2,
  'Chhattisgarh':      7.1,
  'Haryana':           6.4,
  'Kerala':            6.3,
  'Assam':             6.7,
  'Maharashtra':       5.9,
  'West Bengal':       5.2,
  'Odisha':            5.0,
  'Telangana':         5.6,
  'Gujarat':           4.6,
  'Karnataka':         5.3,
  'Tamil Nadu':        4.9,
  'Andhra Pradesh':    4.7,
  'Punjab':            5.8,
  'Goa':               4.2,
  'Himachal Pradesh':  3.8,
  'Uttarakhand':       4.5,
  'Tripura':           5.5,
}

/** States/regions a road route passes through (including transit states) */
export const ROUTE_STATES: Record<string, string[]> = {
  'Bangalore-Chennai':      ['Karnataka', 'Tamil Nadu'],
  'Chennai-Bangalore':      ['Tamil Nadu', 'Karnataka'],
  'Delhi-Agra':             ['Delhi', 'Haryana', 'Uttar Pradesh'],
  'Agra-Delhi':             ['Uttar Pradesh', 'Haryana', 'Delhi'],
  'Mumbai-Pune':            ['Maharashtra'],
  'Pune-Mumbai':            ['Maharashtra'],
  'Kolkata-Bhubaneswar':   ['West Bengal', 'Odisha'],
  'Bhubaneswar-Kolkata':   ['Odisha', 'West Bengal'],
  'Hyderabad-Vijayawada':  ['Telangana', 'Andhra Pradesh'],
  'Vijayawada-Hyderabad':  ['Andhra Pradesh', 'Telangana'],
  'Mumbai-Delhi':           ['Maharashtra', 'Gujarat', 'Rajasthan', 'Haryana', 'Delhi'],
  'Delhi-Mumbai':           ['Delhi', 'Haryana', 'Rajasthan', 'Gujarat', 'Maharashtra'],
  'Bangalore-Mumbai':       ['Karnataka', 'Goa', 'Maharashtra'],
  'Mumbai-Bangalore':       ['Maharashtra', 'Goa', 'Karnataka'],
  'Delhi-Kolkata':          ['Delhi', 'Uttar Pradesh', 'Bihar', 'Jharkhand', 'West Bengal'],
  'Kolkata-Delhi':          ['West Bengal', 'Jharkhand', 'Bihar', 'Uttar Pradesh', 'Delhi'],
  'Hyderabad-Bangalore':    ['Telangana', 'Andhra Pradesh', 'Karnataka'],
  'Bangalore-Hyderabad':    ['Karnataka', 'Andhra Pradesh', 'Telangana'],
  'Chennai-Mumbai':         ['Tamil Nadu', 'Andhra Pradesh', 'Telangana', 'Maharashtra'],
  'Mumbai-Chennai':         ['Maharashtra', 'Telangana', 'Andhra Pradesh', 'Tamil Nadu'],
}

/** City → State mapping */
export const CITY_STATE: Record<string, string> = {
  'Bangalore':   'Karnataka',
  'Chennai':     'Tamil Nadu',
  'Mumbai':      'Maharashtra',
  'Pune':        'Maharashtra',
  'Delhi':       'Delhi',
  'Agra':        'Uttar Pradesh',
  'Hyderabad':   'Telangana',
  'Vijayawada':  'Andhra Pradesh',
  'Kolkata':     'West Bengal',
  'Bhubaneswar': 'Odisha',
  'Ahmedabad':   'Gujarat',
  'Jaipur':      'Rajasthan',
  'Surat':       'Gujarat',
  'Lucknow':     'Uttar Pradesh',
  'Nagpur':      'Maharashtra',
}

/** Transport mode base risk score (1–10) */
export const MODE_RISK: Record<string, number> = {
  Road:  7,
  Rail:  3,
  Air:   2,
  Ship:  4,
}

/** Relative time and cost multipliers (Road = 1.0 baseline) */
export const MODE_RELATIVE: Record<string, { time: number; cost: number; label: string }> = {
  Road: { time: 1.0, cost: 1.0, label: 'Road' },
  Rail: { time: 1.3, cost: 0.6, label: 'Rail' },
  Air:  { time: 0.4, cost: 3.0, label: 'Air'  },
  Ship: { time: 2.5, cost: 0.5, label: 'Ship' },
}

export interface RouteAnalysis {
  states: string[]
  avgCrimeScore: number
  modes: ModeResult[]
  best: ModeResult
  alternative: ModeResult
  riskLabel: 'Low' | 'Medium' | 'High'
  message: string
}

export interface ModeResult {
  mode: string
  modeRisk: number
  totalRisk: number
  timeMultiplier: number
  costMultiplier: number
  finalScore: number
  rank: number
  recommended: boolean
  avoidForHighCargo: boolean
}

export function analyzeRoute(
  source: string,
  destination: string,
  cargoValue: 'low' | 'medium' | 'high',
): RouteAnalysis {
  const key        = `${source}-${destination}`
  const altKey     = `${destination}-${source}`

  // Get states on route
  let states = ROUTE_STATES[key] ?? ROUTE_STATES[altKey] ?? []
  if (states.length === 0) {
    const srcState = CITY_STATE[source]
    const dstState = CITY_STATE[destination]
    states = Array.from(new Set([srcState, dstState].filter(Boolean)))
  }

  // Average crime score across route states
  const scores    = states.map(s => STATE_CRIME_SCORES[s] ?? 5.0)
  const avgCrime  = scores.length > 0
    ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
    : 5.0

  // Calculate total risk and final score per mode
  // Total Risk = 0.6 × crime_score + 0.4 × mode_risk
  // Final Score = 0.3 × time + 0.3 × cost + 0.4 × total_risk  (all normalised 0–1)
  const modes = Object.keys(MODE_RISK).map(mode => {
    const modeRisk  = MODE_RISK[mode]
    const totalRisk = Math.round((0.6 * avgCrime + 0.4 * modeRisk) * 10) / 10
    const rel       = MODE_RELATIVE[mode]
    // Normalise: time 0.4–2.5 → 0–1, cost 0.5–3.0 → 0–1, risk 0–10 → 0–1
    const timeN  = (rel.time - 0.4) / (2.5 - 0.4)
    const costN  = (rel.cost - 0.5) / (3.0 - 0.5)
    const riskN  = totalRisk / 10
    const finalScore = Math.round((0.3 * timeN + 0.3 * costN + 0.4 * riskN) * 100) / 100

    const avoidForHighCargo = cargoValue === 'high' && totalRisk > 5

    return {
      mode,
      modeRisk,
      totalRisk,
      timeMultiplier: rel.time,
      costMultiplier: rel.cost,
      finalScore,
      rank: 0,
      recommended: false,
      avoidForHighCargo,
    } as ModeResult
  })

  // Rank by finalScore (lower = better)
  modes.sort((a, b) => a.finalScore - b.finalScore)
  modes.forEach((m, i) => { m.rank = i + 1; m.recommended = i === 0 })

  const best        = modes[0]
  const alternative = modes[1]

  // Risk label based on best mode's total risk
  const riskLabel: RouteAnalysis['riskLabel'] =
    best.totalRisk <= 4   ? 'Low' :
    best.totalRisk <= 6   ? 'Medium' : 'High'

  // Reduction vs road
  const roadRisk   = modes.find(m => m.mode === 'Road')?.totalRisk ?? 0
  const reduction  = roadRisk > 0
    ? Math.round(((roadRisk - best.totalRisk) / roadRisk) * 100)
    : 0
  const cargoNote  = cargoValue === 'high' ? ' For HIGH value cargo, avoid road entirely.' : ''

  const message = best.mode === 'Road'
    ? `Crime score on ${source}–${destination} route: ${avgCrime}/10. Road transport carries the highest risk (${best.totalRisk}/10). Consider upgrading to Rail or Air for safer delivery.${cargoNote}`
    : `${riskLabel} theft risk detected on ${source}–${destination} route (crime score: ${avgCrime}/10). Switching from Road to ${best.mode} reduces total risk by ${reduction}% (from ${roadRisk} → ${best.totalRisk}).${cargoNote}`

  return { states, avgCrimeScore: avgCrime, modes, best, alternative, riskLabel, message }
}
