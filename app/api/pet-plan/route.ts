import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { CITY_COORDS, REST_STOPS } from '@/lib/mapData';

const execAsync = promisify(exec);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { pet_type = 'dog', weight = 15, age = 3, distance = 500, temperature = 35, source, destination } = body;

    // 3. Auto fetch temperature
    if (source && CITY_COORDS[source]) {
      try {
        const { lat, lng } = CITY_COORDS[source];
        const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`);
        if (wRes.ok) {
          const wData = await wRes.json();
          if (wData?.current_weather?.temperature) {
            temperature = wData.current_weather.temperature;
          }
        }
      } catch (e) {
        console.error('Weather fetch error', e);
      }
    }

    const pyScript = path.join(process.cwd(), 'pet_module.py');
    const command = `python "${pyScript}" "${pet_type}" ${weight} ${age} ${distance} ${temperature}`;

    const { stdout, stderr } = await execAsync(command);

    if (stderr && !stdout) {
      console.error('Python Error:', stderr);
      return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
    }

    let result;
    try {
       result = JSON.parse(stdout);
       
       if (result.rest_stops && source && destination) {
          const routeKey1 = `${source}-${destination}`;
          const routeKey2 = `${destination}-${source}`;
          
          let routeStops = REST_STOPS[routeKey1] || REST_STOPS[routeKey2];
          
          if (!routeStops || routeStops.length === 0) {
             routeStops = Object.values(REST_STOPS).flat();
          }
          
          if (routeStops && routeStops.length > 0) {
            result.rest_stops = result.rest_stops.map((stop: any, index: number) => {
              const actualStop = routeStops[index % routeStops.length];
              return {
                ...stop,
                location: actualStop.name,
                purpose: `Hydration, rest & ${actualStop.type === 'fuel' ? 'refuel' : actualStop.type === 'food' ? 'food break' : 'stretch'}`
              };
            });
          }
       }

    } catch(e) {
       result = { error: 'Invalid JSON from Python' };
    }
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
  }
}
