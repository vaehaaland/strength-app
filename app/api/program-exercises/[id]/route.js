import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function PUT(request, { params }) {
    try {
        const resolvedParams = await params;
        const database = await getDatabase();
        const { sets, reps, one_rm, notes } = await request.json();

        const result = await database.run(
            `UPDATE program_exercises 
       SET sets = ?, reps = ?, one_rm = ?, notes = ? 
       WHERE id = ?`,
            [sets, reps, one_rm, notes, resolvedParams.id]
        );

        if (result.changes === 0) {
            return NextResponse.json({ error: 'Exercise not found in program' }, { status: 404 });
        }

        return NextResponse.json({ id: resolvedParams.id, sets, reps, one_rm, notes });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const resolvedParams = await params;
        const database = await getDatabase();

        const result = await database.run('DELETE FROM program_exercises WHERE id = ?', [resolvedParams.id]);

        if (result.changes === 0) {
            return NextResponse.json({ error: 'Exercise not found in program' }, { status: 404 });
        }

        return NextResponse.json({ success: true, id: resolvedParams.id });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
