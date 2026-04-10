import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 })
    }

    const docRef = doc(db, 'shipments', orderId)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }

    const shipment = docSnap.data()

    const prompt = `You are LogiFlow's customer-facing AI Assistant. Your job is to explain the current status of an order to the client in a friendly, reassuring, and completely natural way. 

Here is the raw data for their order:
- Order ID: ${orderId}
- Route: ${shipment.source} -> ${shipment.destination}
- Status: ${shipment.status}
- Distance: ${shipment.distance} km
- Transport Mode: ${shipment.vehicle}
- ETA: ${shipment.eta} minutes
- Delay Risk: ${shipment.delay_risk}

(If this order is a "Pet Transport" order, it will have these extra details)
- Is Pet? ${shipment.pet_type ? 'Yes (' + shipment.pet_type + ')' : 'No'}
${shipment.pet_type ? `- Pet Comfort Score: ${shipment.pet_comfort_score}/100\n- Pet Risk Level: ${shipment.pet_risk}\n- Planned Rest Stops: ${shipment.pet_rest_stops?.length || 0}` : ''}

Draft a 2-3 paragraph response for the customer.
1. Be extremely polite, empathetic, and professional.
2. Clearly state where their shipment is and when it will arrive.
3. If there is a delay risk or it's a pet, reassure them about the proactive steps (like rest stops or secure transport). 
4. DO NOT use markdown formatting like **bold** or *italics*. Just return plain text paragraphs separated by two newlines.
`

    const message = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
    })

    const resultText = message.choices[0].message.content?.trim() || ''
    
    return NextResponse.json({ 
      success: true, 
      data: {
        explanation: resultText,
        shipment
      } 
    })
  } catch (error) {
    console.error('Tracking AI error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to generate explanation. Please try again later.' 
    }, { status: 500 })
  }
}
