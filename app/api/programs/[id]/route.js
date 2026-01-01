import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const database = await getDatabase();
    const program = await database.get('SELECT * FROM workout_programs WHERE id = ?', [resolvedParams.id]);

    if (!program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    const workouts = await database.all(
      'SELECT * FROM program_workouts WHERE program_id = ? ORDER BY day_number',
      [resolvedParams.id]
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
export async function PUT(request, { params }) {
  try {
    const resolvedParams = await params;
    const database = await getDatabase();
    const { name, description, is_active } = await request.json();

    const result = await database.run(
      'UPDATE workout_programs SET name = ?, description = ?, is_active = ? WHERE id = ?',
      [name, description, is_active ? 1 : 0, resolvedParams.id]
    );

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    return NextResponse.json({ id: resolvedParams.id, name, description, is_active });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
