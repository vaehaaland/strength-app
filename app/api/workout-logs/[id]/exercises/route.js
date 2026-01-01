import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function POST(request, { params }) {
  try {
    const database = await getDatabase();
    const { exercise_id, set_number, reps, weight, completed, notes } = await request.json();
    const resolvedParams = await params;

    const result = await database.run(
      `INSERT INTO exercise_logs (workout_log_id, exercise_id, set_number, reps, weight, completed, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [resolvedParams.id, exercise_id, set_number, reps, weight, completed, notes]
    );

    return NextResponse.json({ id: result.lastID });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
