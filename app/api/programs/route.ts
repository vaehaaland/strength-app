import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getUserFromRequest(request)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const programs = await prisma.program.findMany({
      where: {
        deletedAt: null,
        userId: session.userId,
      },
      include: {
        exercises: {
          include: {
            exercise: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    return NextResponse.json(programs)
  } catch (error) {
    console.error('Failed to fetch programs:', error)
    return NextResponse.json({ error: 'Failed to fetch programs' }, { status: 500 })
  }
}

type ProgramInputExercise = {
  exerciseId: string
  oneRepMax?: number
  trainingMax?: number
  sets?: number
  reps?: number
  weight?: number | null
}

export async function POST(request: NextRequest) {
  try {
    const session = await getUserFromRequest(request)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, type, description, exercises } = body

    if (!name || !type) {
      return NextResponse.json({ error: 'Name and type are required' }, { status: 400 })
    }

    const program = await prisma.program.create({
      data: {
        name,
        type,
        description,
        userId: session.userId,
        exercises: {
          create: (exercises as ProgramInputExercise[] | undefined)?.map((ex, index: number) => {
            const oneRepMax = typeof ex.oneRepMax === 'number' ? ex.oneRepMax : null
            const trainingMax =
              typeof ex.trainingMax === 'number'
                ? ex.trainingMax
                : oneRepMax
                ? oneRepMax * 0.9
                : null

            return {
              exerciseId: ex.exerciseId,
              oneRepMax,
              trainingMax,
              sets: typeof ex.sets === 'number' ? ex.sets : null,
              reps: typeof ex.reps === 'number' ? ex.reps : null,
              weight: typeof ex.weight === 'number' ? ex.weight : null,
              order: index,
            }
          }) || [],
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

    return NextResponse.json(program, { status: 201 })
  } catch (error) {
    console.error('Failed to create program:', error)
    return NextResponse.json({ error: 'Failed to create program' }, { status: 500 })
  }
}
