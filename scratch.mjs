import { NextRequest } from 'next/server';
import { POST } from './app/api/negotiate/route.js'; // Let's just mock NextRequest

async function mockTest() {
  const payloads = [
    { name: "Lowball", basePrice: 1000, companyRevenue: 5000000, messages: [{ role: 'user', content: 'I will pay 100 INR.' }] },
    { name: "Reasonable", basePrice: 1000, companyRevenue: 5000000, messages: [{ role: 'user', content: 'How about 1100?' }] },
    { name: "Empty", basePrice: 1000, companyRevenue: 5000000, messages: [] }
  ];

  for (const p of payloads) {
    console.log(`\n--- Test: ${p.name} ---`);
    const req = {
      json: async () => p
    } as any;
    
    try {
      const res = await POST(req);
      const data = await res.json();
      console.log('Result:', JSON.stringify(data, null, 2));
    } catch(e) {
      console.error('Error:', e);
    }
  }
}

// Ensure ANTHROPIC API KEY exists or we'll get an error
if (!process.env.ANTHROPIC_API_KEY) {
  console.log('⚠️ No Anthropic API Key found. The test will likely fail at the fetch step.');
}

mockTest();
