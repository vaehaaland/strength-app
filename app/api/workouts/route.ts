import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type WorkoutSetInput = {
  reps: number
  weight?: number | null
  rpe?: number
}

type WorkoutExerciseInput = {
  exerciseId: string
  notes?: string
  sets?: WorkoutSetInput[]
}

export async function GET() {
  try {
    const workouts = await prisma.workout.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        program: true,
        exercises: {
          include: {
            exercise: true,
            sets: {
              orderBy: {
                setNumber: 'asc',
              },
            },
          },
          orderBy: {
            order: 'asc',
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
    const { name, date, notes, exercises, programId } = body

    if (!name) {
      return NextResponse.json({ error: 'Workout name is required' }, { status: 400 })
    }

    const workout = await prisma.workout.create({
      data: {
        name,
        date: date ? new Date(date) : new Date(),
        notes,
        programId: programId || null,
        exercises: {
          create: (exercises as WorkoutExerciseInput[] | undefined)?.map((ex, index: number) => ({
            exerciseId: ex.exerciseId,
            order: index,
            notes: ex.notes,
            sets: {
              create: ex.sets?.map((set, setIndex: number) => ({
                setNumber: setIndex + 1,
                reps: set.reps,
                weight: typeof set.weight === 'number' ? set.weight : null,
                rpe: set.rpe,
              })) || [],
            },
          })) || [],
        },
      },
      include: {
        program: true,
        exercises: {
          include: {
            exercise: true,
            sets: {
              orderBy: {
                setNumber: 'asc',
              },
            },
          },
          orderBy: {
            order: 'asc',
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
