import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const exercises = [
      { name: 'Squat', category: 'compound' },
      { name: 'Bench Press', category: 'compound' },
      { name: 'Deadlift', category: 'compound' },
      { name: 'Overhead Press', category: 'compound' },
      { name: 'Barbell Row', category: 'compound' },
      { name: 'Front Squat', category: 'compound' },
      { name: 'Incline Bench Press', category: 'compound' },
      { name: 'Romanian Deadlift', category: 'accessory' },
      { name: 'Pull-ups', category: 'accessory' },
      { name: 'Dips', category: 'accessory' },
      { name: 'Lunges', category: 'accessory' },
      { name: 'Leg Press', category: 'accessory' },
    ]

    for (const exercise of exercises) {
      await prisma.exercise.upsert({
        where: { name: exercise.name },
        update: {},
        create: exercise,
      })
    }

    return NextResponse.json({ success: true, message: 'Exercises seeded' })
  } catch (error) {
    console.error('Failed to seed exercises:', error)
    return NextResponse.json({ error: 'Failed to seed exercises' }, { status: 500 })
  }
}
