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
          create: exercises?.map((ex: any, index: number) => ({
            exerciseId: ex.exerciseId,
            order: index,
            notes: ex.notes,
            sets: {
              create: ex.sets?.map((set: any, setIndex: number) => ({
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
