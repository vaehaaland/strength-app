import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type WorkoutPayloadExercise = {
  exerciseId: string
  notes?: string
  sets?: {
    reps: number
    weight: number
    rpe?: number
  }[]
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, date, notes, exercises } = body

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
          exercises: {
            create: exercises?.map((ex: WorkoutPayloadExercise, index: number) => ({
              exerciseId: ex.exerciseId,
              order: index,
              notes: ex.notes,
              sets: {
                create: ex.sets?.map((set, setIndex: number) => ({
                  setNumber: setIndex + 1,
                  reps: set.reps,
                  weight: set.weight,
                  rpe: set.rpe,
                })) || [],
              },
            })) || [],
          },
      },
      include: {
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
