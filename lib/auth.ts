import { NextRequest } from 'next/server'
import { prisma } from './prisma'

export interface SessionData {
  userId: string
  email: string
}

// Simple session validation - in production, use proper JWT or session management
export async function getUserFromRequest(request: NextRequest): Promise<SessionData | null> {
  const authHeader = request.headers.get('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  
  try {
    // Parse the simple token format: userId:email
    // In production, use proper JWT tokens
    const [userId, email] = Buffer.from(token, 'base64').toString().split(':')
    
    if (!userId || !email) {
      return null
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId, email },
    })

    if (!user) {
      return null
    }

    return { userId, email }
  } catch (error) {
    return null
  }
}

export function createAuthToken(userId: string, email: string): string {
  // Simple token format - in production, use proper JWT
  return Buffer.from(`${userId}:${email}`).toString('base64')
}
