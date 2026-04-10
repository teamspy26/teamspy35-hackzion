// SCRATCH PAD: Brutal Testing of the Negotiation Parsing Logic
console.log("=== BEGIN BRUTAL TESTING ===");

const MOCK_AI_RESPONSES = [
  // 1. Perfect case
  \`{
    "reply": "DEAL_ACCEPTED: 1050\\n\\nGreat, we have a deal!",
    "isDealAccepted": true,
    "finalPrice": 1050
  }\`,

  // 2. Claude returns markdown
  \`\`\`json
  {
    "reply": "We can agree on this. DEAL_ACCEPTED: 1050",
    "isDealAccepted": true,
    "finalPrice": 1050
  }
  \`\`\`,

  // 3. AI forgets finalPrice but includes string
  \`{
    "reply": "Fine. DEAL_ACCEPTED: 900.",
    "isDealAccepted": false,
    "finalPrice": null
  }\`,

  // 4. Broken JSON / Halucinated trailing commas
  \`{
    "reply": "DEAL_ACCEPTED: 1200",
    "isDealAccepted": true,
    "finalPrice": 1200,
  }\`,

  // 5. Brutal Edge Case: Number inside punctuation
  \`{
    "reply": "I accept. DEAL_ACCEPTED: 999! Thank you.",
    "isDealAccepted": true,
    "finalPrice": null
  }\`
];

function simulateFrontendParser(data, baseCost) {
  let aiContent = data.reply;
  let dealReached = false;
  let finalPrice = null;

  if (data.isDealAccepted || aiContent.includes('DEAL_ACCEPTED')) {
    dealReached = true;
    const priceMatch = aiContent.match(/DEAL_ACCEPTED:\\s*(\\d+)/) || [];
    const extractedPrice = data.finalPrice || parseInt(priceMatch[1], 10) || baseCost;
    
    finalPrice = extractedPrice;
    
    aiContent = aiContent.replace(/DEAL_ACCEPTED:\\s*\\d+/, '').replace(/[^a-zA-Z0-9 ]/g, '').trim();
    if (!aiContent) {
        aiContent = \`We have a deal at \${extractedPrice} INR! Click below to send this quote for manager approval.\`;
    }
  }

  return { dealReached, finalPrice, cleanReply: aiContent };
}

MOCK_AI_RESPONSES.forEach((raw, idx) => {
  console.log(\`\\n--- TEST CASE \${idx + 1} ---\`);
  try {
    // API Route parsing simulation
    const cleanJson = raw.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    // brutal JSON parse handling (eval for trailing comma)
    let parsed;
    try {
      parsed = JSON.parse(cleanJson);
    } catch(e) {
      if (e.message.includes('JSON')) {
         // simple fallback for trailing comma
         const fixed = cleanJson.replace(/,\\s*}/, '}');
         parsed = JSON.parse(fixed);
      }
    }
    console.log("API JSON Parse: SUCCESS");

    // Client Parsing Simulation
    const result = simulateFrontendParser(parsed, 1000);
    console.log("Frontend Handling:", result);
  } catch(e) {
    console.error("FAIL:", e.message);
  }
});
