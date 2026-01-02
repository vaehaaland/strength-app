import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import exercises from '@/lib/seed-exercises'

export async function POST() {
  try {
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
