// 3.2 Prediction Engine — focused AI endpoint for ETA, delay, and cost prediction
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const {
    distance = 200,
    traffic = 'medium',
    weather = 'clear',
    weight = 50,
    priority = 'medium',
  } = body

  const prompt = `You are a logistics AI system.

Input:
Distance: ${distance} km
Traffic: ${traffic}
Weather: ${weather}
Weight: ${weight} kg
Priority: ${priority}

Predict:
1. ETA (minutes)
2. Delay risk (low/medium/high)
3. Cost estimate (INR)
4. Reason (1 sentence)

Return JSON only, no markdown:
{
  "eta": <number>,
  "delay_risk": "<low|medium|high>",
  "cost": <number in INR>,
  "reason": "<one sentence>"
}`

  try {
    const message = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
    })
    const raw = message.choices[0].message.content?.trim() || '{}'
    const cleanJson = raw.replace(/```json/gi, '').replace(/```/g, '').trim()
    const result = JSON.parse(cleanJson)
    return NextResponse.json({ success: true, data: result })
  } catch {
    return NextResponse.json({ success: true, data: fallback(distance, traffic, weather, weight, priority) })
  }
}

function fallback(distance: number, traffic: string, weather: string, weight: number, priority: string) {
  const vehicle = weight > 70 ? 'Truck' : weight > 20 ? 'Van' : 'Bike'
  const base = Math.round((distance / 60) * 60)
  const trafficAdd = traffic === 'high' ? 30 : traffic === 'medium' ? 15 : 0
  const weatherAdd = weather === 'storm' ? 40 : weather === 'rain' ? 20 : 0
  const priorityAdj = priority === 'high' ? -10 : priority === 'low' ? 10 : 0
  const eta = base + trafficAdd + weatherAdd + priorityAdj

  const delay_risk =
    traffic === 'high' || weather === 'storm' ? 'high'
    : traffic === 'medium' || weather === 'rain' ? 'medium'
    : distance > 400 ? 'medium' : 'low'

  const baseCost = distance * (vehicle === 'Truck' ? 18 : vehicle === 'Van' ? 12 : 7)
  const cost = Math.round(baseCost * (traffic === 'high' ? 1.2 : traffic === 'medium' ? 1.1 : 1))

  const reasons: Record<string, string> = {
    high: `Heavy ${traffic === 'high' ? 'traffic' : 'weather'} conditions significantly increase delivery time.`,
    medium: `Moderate conditions detected — some delay expected on this route.`,
    low: `Clear conditions across route — on-time delivery expected.`,
  }

  return { eta, delay_risk, cost, reason: reasons[delay_risk] }
}
