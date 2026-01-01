import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function POST(request, { params }) {
  try {
    const resolvedParams = await params;
    const database = await getDatabase();
    const { exercise_id, sets, reps, weight_percentage, notes, exercise_order } =
      await request.json();

    const result = await database.run(
      `INSERT INTO program_exercises (program_workout_id, exercise_id, sets, reps, weight_percentage, notes, exercise_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [resolvedParams.id, exercise_id, sets, reps, weight_percentage, notes, exercise_order]
    );

    return NextResponse.json({ id: result.lastID });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
