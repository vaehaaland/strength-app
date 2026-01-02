import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const database = await getDatabase();
    const resolvedParams = await params;
    const exercise = await database.get('SELECT * FROM exercises WHERE id = ?', [resolvedParams.id]);

    if (!exercise) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
    }

    return NextResponse.json(exercise);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
