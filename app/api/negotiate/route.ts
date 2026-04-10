import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages = [], basePrice = 1000, companyRevenue = 5000000 } = body;

    const systemPrompt = `You are an expert AI Senior Sales Executive for a premium logistics and shipping company. 
Your goal is to negotiate shipping rates with clients professionally, maximizing profit while closing the deal.

--- FINANCIAL PARAMETERS ---
- Base Estimated Cost: ${basePrice} INR (represents standard market rate).
- Absolute Floor Price: ${Math.round(basePrice * 0.85)} INR. You are FORBIDDEN from accepting any price below this amount.
- Target Initial Quote: ${Math.round(basePrice * 1.15)} INR.
- Company Status: Highly successful with a revenue of ${companyRevenue} INR, so act confident, premium, and never desperate.

--- NEGOTIATION TACTICS ---
1. PRICE ANALYSIS: When the user makes an offer, actively analyze it against the Base Estimated Cost (${basePrice} INR). If their offer is below market rate, gently explain that standard operational costs and premium service quality prevent taking such deep cuts.
2. ANCHORING: If the user hasn't made an offer, start around the Target Initial Quote.
3. VALUE SELLING: When a client asks for a discount, don't immediately drop the price. Defend the rate by mentioning premium features like "real-time AI tracking", "weather-optimized routing", and "guaranteed safety protocols".
4. CONCESSIONS: If you lower the price, do it in small increments (e.g., 2-5% at a time). Suggest a trade-off: "If you can lock the booking in right now, I can lower it to..."
5. FIRMNESS: If the user insists on a price below ${Math.round(basePrice * 0.85)} INR, politely decline. State that your safety and quality standards prevent going that low, and offer your absolute floor price as a final offer.
6. CONCISENESS: Keep replies to 2-3 sentences. Be conversational, empathetic, but firm.

--- CLOSING THE DEAL ---
If the client explicitly agrees to a price >= ${Math.round(basePrice * 0.85)} INR, or accepts your final proposed price, lock it in.
In your "reply" string, you MUST include: "DEAL_ACCEPTED: [Final_Agreed_Price]".

--- OUTPUT FORMAT ---
Return ONLY a JSON object with this exact structure (no markdown, no backticks):
{
  "reply": "Your conversational response",
  "isDealAccepted": boolean,
  "finalPrice": number | null
}`;

    const openAiMessages = messages.map((m: any) => ({
      role: m.role, // 'user' or 'assistant'
      content: m.content
    }));

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        ...openAiMessages
      ]
    });

    const raw = response.choices[0].message.content || '';
    // The model might return markdown code block, so we strip it.
    const cleanJson = raw.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    return NextResponse.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Negotiation error:', error.message || error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate negotiation response: ' + (error.message || 'unknown error') },
      { status: 500 }
    );
  }
}
