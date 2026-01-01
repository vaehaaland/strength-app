import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const database = await getDatabase();
    const log = await database.get(
      `SELECT wl.*, pw.name as workout_name, wp.name as program_name
       FROM workout_logs wl
       LEFT JOIN program_workouts pw ON wl.program_workout_id = pw.id
       LEFT JOIN workout_programs wp ON pw.program_id = wp.id
       WHERE wl.id = ?`,
      [params.id]
    );

    if (!log) {
      return NextResponse.json({ error: 'Workout log not found' }, { status: 404 });
    }

    const exercises = await database.all(
      `SELECT el.*, e.name as exercise_name
       FROM exercise_logs el
       JOIN exercises e ON el.exercise_id = e.id
       WHERE el.workout_log_id = ?
       ORDER BY el.exercise_id, el.set_number`,
      [params.id]
    );

    log.exercises = exercises;
    return NextResponse.json(log);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const database = await getDatabase();
    const { completed, notes } = await request.json();

    await database.run(
      'UPDATE workout_logs SET completed = ?, notes = ? WHERE id = ?',
      [completed, notes, params.id]
    );

    return NextResponse.json({ id: params.id, completed, notes });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
