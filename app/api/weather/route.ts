import { NextResponse } from 'next/server';
import { getWeather } from '@/lib/weather';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get('city');

  if (!city) {
    return NextResponse.json({ success: false, error: 'City is required' }, { status: 400 });
  }

  try {
    const temperature = await getWeather(city);
    return NextResponse.json({ success: true, temperature });
  } catch (error: any) {
    console.error('Error fetching weather data:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server Error' }, { status: 500 });
  }
}
