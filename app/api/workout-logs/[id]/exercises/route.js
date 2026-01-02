import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function POST(request, { params }) {
  try {
    const database = await getDatabase();
    const { exercise_id, set_number, reps, weight, completed, notes } = await request.json();
    const resolvedParams = await params;

    // Check if entry already exists for this set
    const existing = await database.get(
      'SELECT id FROM exercise_logs WHERE workout_log_id = ? AND exercise_id = ? AND set_number = ?',
      [resolvedParams.id, exercise_id, set_number]
    );

    let id;
    if (existing) {
      await database.run(
        `UPDATE exercise_logs 
         SET reps = ?, weight = ?, completed = ?, notes = ? 
         WHERE id = ?`,
        [reps, weight, completed ? 1 : 0, notes, existing.id]
      );
      id = existing.id;
    } else {
      const result = await database.run(
        `INSERT INTO exercise_logs (workout_log_id, exercise_id, set_number, reps, weight, completed, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [resolvedParams.id, exercise_id, set_number, reps, weight, completed ? 1 : 0, notes]
      );
      id = result.lastID;
    }

    return NextResponse.json({ id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
