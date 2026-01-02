import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type WorkoutPayloadExercise = {
  exerciseId: string
  notes?: string
  sets?: {
    reps: number
    weight?: number | null
    rpe?: number
  }[]
}
type WorkoutPayload = {
  name: string
  date?: string
  notes?: string
  programId?: string | null
  exercises?: WorkoutPayloadExercise[]
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Soft delete
    const workout = await prisma.workout.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    })

    return NextResponse.json(workout)
  } catch (error) {
    console.error('Failed to delete workout:', error)
    return NextResponse.json({ error: 'Failed to delete workout' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const workout = await prisma.workout.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        program: true,
        exercises: {
          include: {
            exercise: true,
            sets: {
              orderBy: { setNumber: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!workout) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 })
    }

    return NextResponse.json(workout)
  } catch (error) {
    console.error('Failed to fetch workout:', error)
    return NextResponse.json({ error: 'Failed to fetch workout' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body: WorkoutPayload = await request.json()
    const { name, date, notes, exercises, programId } = body

    if (!name) {
      return NextResponse.json({ error: 'Workout name is required' }, { status: 400 })
    }

    await prisma.workoutExercise.deleteMany({ where: { workoutId: id } })

    const workout = await prisma.workout.update({
      where: { id },
      data: {
        name,
        date: date ? new Date(date) : undefined,
        notes,
        programId: programId || null,
          exercises: {
            create: exercises?.map((ex: WorkoutPayloadExercise, index: number) => ({
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
            sets: { orderBy: { setNumber: 'asc' } },
          },
          orderBy: { order: 'asc' },
        },
      },
    })

    return NextResponse.json(workout)
  } catch (error) {
    console.error('Failed to update workout:', error)
    return NextResponse.json({ error: 'Failed to update workout' }, { status: 500 })
  }
}
