import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      stop_time_mins = 0, 
      speed_variation_pct = 0, 
      is_off_route = false, 
      is_night_driving = false 
    } = body;

    const pyScript = path.join(process.cwd(), 'driver_safety_module.py');
    const command = `python "${pyScript}" ${stop_time_mins} ${speed_variation_pct} ${is_off_route} ${is_night_driving}`;

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
    console.error('Driver Safety Error:', error);
    return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
  }
}
