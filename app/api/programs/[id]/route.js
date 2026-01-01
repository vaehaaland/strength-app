import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const database = await getDatabase();
    const program = await database.get('SELECT * FROM workout_programs WHERE id = ?', [params.id]);

    if (!program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    const workouts = await database.all(
      'SELECT * FROM program_workouts WHERE program_id = ? ORDER BY day_number',
      [params.id]
    );

    for (const workout of workouts) {
      const exercises = await database.all(
        `SELECT pe.*, e.name as exercise_name, e.category
         FROM program_exercises pe
         JOIN exercises e ON pe.exercise_id = e.id
         WHERE pe.program_workout_id = ?
         ORDER BY pe.exercise_order`,
        [workout.id]
      );
      workout.exercises = exercises;
    }

    program.workouts = workouts;
    return NextResponse.json(program);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
