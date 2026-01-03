import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getUserFromRequest(request)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const metrics = await prisma.bodyMetric.findMany({
      where: {
        userId: session.userId,
      },
      orderBy: {
        date: 'desc',
      },
    })
    return NextResponse.json(metrics)
  } catch (error) {
    console.error('Failed to fetch body metrics:', error)
    return NextResponse.json({ error: 'Failed to fetch body metrics' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getUserFromRequest(request)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { date, weight, bodyFat, notes } = body

    const metric = await prisma.bodyMetric.create({
      data: {
        date: date ? new Date(date) : new Date(),
        weight,
        bodyFat,
        notes,
        userId: session.userId,
      },
    })

    return NextResponse.json(metric, { status: 201 })
  } catch (error) {
    console.error('Failed to create body metric:', error)
    return NextResponse.json({ error: 'Failed to create body metric' }, { status: 500 })
  }
}
