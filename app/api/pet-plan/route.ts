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

