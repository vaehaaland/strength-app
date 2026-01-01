import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const workouts = await prisma.workout.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        exercises: {
          include: {
            exercise: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    })
    return NextResponse.json(workouts)
  } catch (error) {
    console.error('Failed to fetch workouts:', error)
    return NextResponse.json({ error: 'Failed to fetch workouts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, date, notes, exercises } = body

    if (!name) {
      return NextResponse.json({ error: 'Workout name is required' }, { status: 400 })
    }

    const workout = await prisma.workout.create({
      data: {
        name,
        date: date ? new Date(date) : new Date(),
        notes,
        exercises: {
          create: exercises?.map((ex: any) => ({
            exerciseId: ex.exerciseId,
            sets: ex.sets,
            reps: ex.reps,
            weight: ex.weight,
            notes: ex.notes,
          })) || [],
        },
      },
      include: {
        exercises: {
          include: {
            exercise: true,
          },
        },
      },
    })

    return NextResponse.json(workout, { status: 201 })
  } catch (error) {
    console.error('Failed to create workout:', error)
    return NextResponse.json({ error: 'Failed to create workout' }, { status: 500 })
  }
}
