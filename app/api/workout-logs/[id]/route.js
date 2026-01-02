import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const database = await getDatabase();
    const log = await database.get(
      `SELECT wl.*, pw.name as workout_name, wp.name as program_name, wp.id as program_id
       FROM workout_logs wl
       LEFT JOIN program_workouts pw ON wl.program_workout_id = pw.id
       LEFT JOIN workout_programs wp ON pw.program_id = wp.id
       WHERE wl.id = ?`,
      [resolvedParams.id]
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
      [resolvedParams.id]
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
    const resolvedParams = await params;
    const database = await getDatabase();
    const { completed, notes } = await request.json();

    await database.run(
      'UPDATE workout_logs SET completed = ?, notes = ? WHERE id = ?',
      [completed, notes, resolvedParams.id]
    );

    return NextResponse.json({ id: resolvedParams.id, completed, notes });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export async function DELETE(request, { params }) {
  try {
    const resolvedParams = await params;
    const database = await getDatabase();

    // Delete exercise logs first (foreign key)
    await database.run('DELETE FROM exercise_logs WHERE workout_log_id = ?', [resolvedParams.id]);

    // Delete the workout log
    await database.run('DELETE FROM workout_logs WHERE id = ?', [resolvedParams.id]);

    return NextResponse.json({ success: true, id: resolvedParams.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
