import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
