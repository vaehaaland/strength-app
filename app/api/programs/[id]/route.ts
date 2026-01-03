import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getUserFromRequest(request)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership
    const existingProgram = await prisma.program.findFirst({
      where: { id, userId: session.userId },
    })

    if (!existingProgram) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    // Soft delete
    const program = await prisma.program.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    })

    return NextResponse.json(program)
  } catch (error) {
    console.error('Failed to delete program:', error)
    return NextResponse.json({ error: 'Failed to delete program' }, { status: 500 })
  }
}
