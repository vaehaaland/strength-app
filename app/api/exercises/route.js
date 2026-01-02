import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function GET() {
  try {
    const database = await getDatabase();
    const exercises = await database.all('SELECT * FROM exercises ORDER BY name');
    return NextResponse.json(exercises);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const database = await getDatabase();
    const { name, category } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Exercise name is required' }, { status: 400 });
    }

    const result = await database.run(
      'INSERT INTO exercises (name, category) VALUES (?, ?)',
      [name.trim(), category]
    );

    return NextResponse.json({ id: result.lastID, name: name.trim(), category });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
