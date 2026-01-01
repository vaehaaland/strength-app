import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function GET() {
  try {
    const database = await getDatabase();
    const programs = await database.all('SELECT * FROM workout_programs ORDER BY created_at DESC');
    return NextResponse.json(programs);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const database = await getDatabase();
    const { name, description, program_type } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Program name is required' }, { status: 400 });
    }

    const result = await database.run(
      'INSERT INTO workout_programs (name, description, program_type) VALUES (?, ?, ?)',
      [name.trim(), description, program_type]
    );

    return NextResponse.json({
      id: result.lastID,
      name: name.trim(),
      description,
      program_type
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
