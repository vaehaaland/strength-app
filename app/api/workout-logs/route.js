import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function GET() {
  try {
    const database = await getDatabase();
    const logs = await database.all(`
      SELECT wl.*, pw.name as workout_name, wp.name as program_name
      FROM workout_logs wl
      LEFT JOIN program_workouts pw ON wl.program_workout_id = pw.id
      LEFT JOIN workout_programs wp ON pw.program_id = wp.id
      ORDER BY wl.date DESC
      LIMIT 50
    `);

    return NextResponse.json(logs);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const database = await getDatabase();
    const { program_workout_id, date, notes } = await request.json();

    const result = await database.run(
      'INSERT INTO workout_logs (program_workout_id, date, notes) VALUES (?, ?, ?)',
      [program_workout_id, date, notes]
    );

    return NextResponse.json({ id: result.lastID, program_workout_id, date, notes });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
