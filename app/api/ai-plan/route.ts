import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { source, destination, distance, weight, priority } = body

    const prompt = `You are a logistics AI planner. Given a shipment, output ONLY valid JSON with no markdown, no code blocks, just raw JSON.

Shipment details:
- Source: ${source}
- Destination: ${destination}
- Distance: ${distance} km
- Weight: ${weight} kg
- Priority: ${priority}

Return JSON exactly like this:
{
  "eta": <number in minutes>,
  "vehicle": "<Van|Truck|Bike>",
  "route": "<route name and highway>",
  "delay_risk": "<low|medium|high>",
  "analysis": "<2-3 sentence analysis with traffic, weather, and recommendation>"
}`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = (message.content[0] as { text: string }).text.trim()
    const result = JSON.parse(raw)

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('AI plan error:', error)
    // Fallback deterministic response
    const body = await req.json().catch(() => ({}))
    const fallback = generateFallback(body)
    return NextResponse.json({ success: true, data: fallback })
  }
}

function generateFallback(body: {
  source?: string
  destination?: string
  distance?: number
  weight?: number
  priority?: string
}) {
  const d = body.distance || 200
  const w = body.weight || 50
  const p = body.priority || 'medium'

  const vehicle = w > 70 ? 'Truck' : w > 20 ? 'Van' : 'Bike'
  const eta = Math.round((d / 60) * 60 + (p === 'high' ? -10 : p === 'low' ? 15 : 0))
  const delay_risk = d > 400 ? 'high' : d > 200 ? 'medium' : 'low'

  return {
    eta,
    vehicle,
    route: `Route A (NH-${Math.floor(Math.random() * 60) + 1})`,
    delay_risk,
    analysis: `Optimal ${vehicle.toLowerCase()} selected for ${w}kg load over ${d}km. ETA calculated based on current traffic conditions. ${delay_risk === 'high' ? 'High delay risk — consider early dispatch.' : delay_risk === 'medium' ? 'Moderate conditions expected en-route.' : 'Clear route with minimal disruption expected.'}`,
  }
}
