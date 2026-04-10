import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { shipmentId, source, destination, route, vehicle, distance, eta, delayRisk, aiAnalysis } = await req.json()

    // Simulate getting real-time weather and traffic based on the route
    const prompt = `You are an eXplainable AI (XAI) agent analyzing logistic delays.
A shipment from ${source} to ${destination} using vehicle ${vehicle} is currently delayed.
Details:
- Distance: ${distance} km
- Original ETA: ${eta} minutes
- Risk Level: ${delayRisk}
- Route: ${route}
- Previous AI Routing Analysis: ${aiAnalysis || 'N/A'}

Provide a customer-friendly, transparent, and slightly technical XAI explanation for why this delay occurred. Mention real-world factors like weather, traffic patterns, or route bottlenecks based on the given context. Keep it under 4 paragraphs. Be honest but reassuring.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an intelligent logistics eXplainable AI.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 400,
    })

    return NextResponse.json({ explanation: completion.choices[0].message.content })
  } catch (error: any) {
    console.error('XAI Delay Exception:', error)
    return NextResponse.json(
      { error: 'Failed to generate explanation. System is currently routing updates.', details: error.message },
      { status: 500 }
    )
  }
}
