import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { readFileSync } from 'fs'
import { join } from 'path'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function loadHistoricalData(distance: number) {
  try {
    const filePath = join(process.cwd(), 'data', 'shipments.json')
    const raw = readFileSync(filePath, 'utf-8')
    const shipments: Array<{
      id: string; source: string; destination: string; distance: number;
      weight: number; priority: string; traffic: string; weather: string;
      delivery_time: number; delay: number; route: string; vehicle: string; cost: number;
    }> = JSON.parse(raw)
    // Pick 3 most similar shipments by distance proximity
    const dist = distance || 200
    shipments.sort((a, b) => Math.abs(a.distance - dist) - Math.abs(b.distance - dist))
    return shipments.slice(0, 3).map(s =>
      `${s.source}→${s.destination} ${s.distance}km ${s.vehicle} ${s.traffic}traffic ${s.weather} ETA:${s.delivery_time}min delay:${s.delay}min cost:₹${s.cost}`
    ).join('\n')
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { source, destination, distance, weight, priority, traffic = 'medium', weather = 'clear' } = body

  const historicalContext = loadHistoricalData(distance)

  try {
    const prompt = `You are a logistics AI planner. Given a shipment, output ONLY valid JSON with no markdown, no code blocks, just raw JSON.

Shipment details:
- Source: ${source}
- Destination: ${destination}
- Distance: ${distance} km
- Weight: ${weight} kg
- Priority: ${priority}
- Traffic: ${traffic}
- Weather: ${weather}
${historicalContext ? `
Historical shipment data (use as reference for realistic ETA and cost estimates):
${historicalContext}
` : ''}
Return JSON exactly like this:
{
  "eta": <number in minutes, adjust for traffic/weather>,
  "vehicle": "<Van|Truck|Bike>",
  "route": "<best route name and highway>",
  "alternate_route": "<alternate route name and highway>",
  "route_eta": <number in minutes for best route>,
  "alternate_route_eta": <number in minutes for alternate route, slightly higher>,
  "delay_risk": "<low|medium|high>",
  "cost": <estimated cost in INR as integer, based on distance and vehicle>,
  "assigned_driver": "<Driver 1|Driver 2|Driver 3>",
  "analysis": "<2-3 sentence analysis mentioning traffic, weather, and recommendation>"
}`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = (message.content[0] as { text: string }).text.trim()
    const result = JSON.parse(raw)
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('AI plan error:', error)
    return NextResponse.json({ success: true, data: generateFallback(body) })
  }
}

function generateFallback(body: {
  source?: string
  destination?: string
  distance?: number
  weight?: number
  priority?: string
  traffic?: string
  weather?: string
}) {
  const d = body.distance || 200
  const w = body.weight || 50
  const p = body.priority || 'medium'
  const traffic = body.traffic || 'medium'
  const weather = body.weather || 'clear'

  const vehicle = w > 70 ? 'Truck' : w > 20 ? 'Van' : 'Bike'

  const trafficAdd = traffic === 'high' ? 30 : traffic === 'medium' ? 15 : 0
  const weatherAdd = weather === 'storm' ? 40 : weather === 'rain' ? 20 : 0
  const priorityAdj = p === 'high' ? -10 : p === 'low' ? 10 : 0

  const baseEta = Math.round((d / 60) * 60)
  const eta = baseEta + trafficAdd + weatherAdd + priorityAdj
  const altEta = eta + Math.round(eta * 0.15)

  const delay_risk =
    traffic === 'high' || weather === 'storm' ? 'high'
    : traffic === 'medium' || weather === 'rain' ? 'medium'
    : d > 400 ? 'medium' : 'low'

  const baseCost = Math.round(d * (vehicle === 'Truck' ? 18 : vehicle === 'Van' ? 12 : 7))
  const cost = Math.round(baseCost * (traffic === 'high' ? 1.2 : traffic === 'medium' ? 1.1 : 1))

  const drivers = ['Driver 1', 'Driver 2', 'Driver 3']
  const assigned_driver = drivers[Math.floor(Math.random() * drivers.length)]

  const nhA = Math.floor(Math.random() * 60) + 1
  const nhB = nhA + Math.floor(Math.random() * 10) + 1

  return {
    eta,
    vehicle,
    route: `Route A — NH-${nhA}`,
    alternate_route: `Route B — NH-${nhB}`,
    route_eta: eta,
    alternate_route_eta: altEta,
    delay_risk,
    cost,
    assigned_driver,
    analysis: `${vehicle} selected for ${w}kg load over ${d}km. ${traffic === 'high' ? 'Heavy traffic detected — added 30 min buffer.' : traffic === 'medium' ? 'Moderate traffic on primary route.' : 'Clear traffic conditions.'} ${weather !== 'clear' ? `${weather === 'storm' ? 'Storm warning' : 'Rain'} en-route — caution advised.` : 'Weather clear.'}`,
  }
}
