import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { pet_type = 'dog', weight = 15, age = 3, distance = 500, temperature = 35 } = body;

    const pyScript = path.join(process.cwd(), 'pet_module.py');
    const command = `python "${pyScript}" ${pet_type} ${weight} ${age} ${distance} ${temperature}`;

    const { stdout, stderr } = await execAsync(command);

    if (stderr && !stdout) {
      console.error('Python Error:', stderr);
      return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
    }

    let result;
    try {
       result = JSON.parse(stdout);
    } catch(e) {
       result = { error: 'Invalid JSON from Python' };
    }
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
  }
}

  const suggestions: string[] = [
    'Add rest stop every 2–3 hours for hydration',
    heatRisk !== 'LOW' ? 'Travel before 10 AM or after 6 PM to avoid peak heat' : 'Ensure ventilation and water supply at all times',
    safeMode === 'Train' ? 'Book pet-friendly train compartment with ventilation' : 'Ensure climate-controlled truck cargo area (below 25°C)',
  ]

  const numStops = Math.floor(eta / 150)
  const rest_stops = Array.from({ length: numStops }, (_, i) => ({
    stop: i + 1,
    at_km: Math.round(((i + 1) * 150 / eta) * dist),
    after_minutes: (i + 1) * 150,
    location: `Highway rest area (${Math.round(((i + 1) * 150 / eta) * dist)} km)`,
    purpose: i === 0 ? 'Hydration & comfort check' : 'Shade rest & ventilation',
  }))

  return {
    comfort_score: score,
    risk,
    heat_risk: heatRisk,
    safe_mode: safeMode,
    safe_mode_reason: safeMode === 'Train'
      ? 'High heat + long distance — train preferred for AC comfort'
      : 'Short route — temperature-controlled truck is ideal',
    eta_minutes: eta,
    alerts,
    suggestions,
    rest_stops,
    analysis: `${petType === 'dog' ? 'Dog' : 'Cat'} transport from ${body.source ?? 'source'} to ${body.destination ?? 'destination'} assessed as ${risk} risk. ${heatRisk === 'HIGH' ? 'Extreme heat conditions require night travel or route change.' : heatRisk === 'MEDIUM' ? 'Moderate heat — AC transport mandatory.' : 'Conditions are acceptable with standard precautions.'} ${safeMode} recommended for this journey.`,
  }
}
