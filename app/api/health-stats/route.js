import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function GET() {
  try {
    const database = await getDatabase();
    const stats = await database.all('SELECT * FROM health_stats ORDER BY date DESC LIMIT 100');
    return NextResponse.json(stats);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const database = await getDatabase();
    const { date, weight, body_fat_percentage, notes } = await request.json();

    const result = await database.run(
      'INSERT INTO health_stats (date, weight, body_fat_percentage, notes) VALUES (?, ?, ?, ?)',
      [date, weight, body_fat_percentage, notes]
    );

    return NextResponse.json({ id: result.lastID, date, weight, body_fat_percentage, notes });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
