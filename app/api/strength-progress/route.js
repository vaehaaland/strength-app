import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

function toNumber(value) {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function estimateOneRepMax(weight, reps) {
  const weightValue = toNumber(weight);
  const repsValue = toNumber(reps);
  if (weightValue == null || repsValue == null) return null;
  if (weightValue <= 0 || repsValue <= 0) return null;

  // Epley formula: 1RM = w * (1 + reps/30)
  return weightValue * (1 + repsValue / 30);
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const exerciseId = url.searchParams.get('exercise_id');
    const includeIncomplete = url.searchParams.get('include_incomplete') === '1';

    if (!exerciseId) {
      return NextResponse.json({ error: 'exercise_id is required' }, { status: 400 });
    }

    const database = await getDatabase();
    const rows = await database.all(
      `
        SELECT wl.date as date,
               wl.completed as workout_completed,
               el.reps as reps,
               el.weight as weight
        FROM exercise_logs el
        JOIN workout_logs wl ON wl.id = el.workout_log_id
        WHERE el.exercise_id = ?
          AND el.reps IS NOT NULL
          AND el.weight IS NOT NULL
          ${includeIncomplete ? '' : 'AND wl.completed = 1'}
        ORDER BY wl.date ASC
      `,
      [exerciseId]
    );

    const byDate = new Map();
    for (const row of rows) {
      const date = row?.date;
      if (!date) continue;

      const est = estimateOneRepMax(row.weight, row.reps);
      if (est == null) continue;

      const existing = byDate.get(date);
      if (!existing || est > existing.estimated_1rm) {
        byDate.set(date, {
          date,
          estimated_1rm: est
        });
      }
    }

    const series = Array.from(byDate.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Keep payload small and stable.
    const normalized = series.map((row) => ({
      date: row.date,
      estimated_1rm: Math.round(row.estimated_1rm * 10) / 10
    }));

    return NextResponse.json(normalized);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
