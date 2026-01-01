import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function POST(request, { params }) {
  try {
    const database = await getDatabase();
    const { name, day_number } = await request.json();

    const result = await database.run(
      'INSERT INTO program_workouts (program_id, name, day_number) VALUES (?, ?, ?)',
      [params.id, name, day_number]
    );

    return NextResponse.json({ id: result.lastID, program_id: params.id, name, day_number });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
