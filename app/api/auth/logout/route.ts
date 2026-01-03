import { NextResponse } from 'next/server'

export async function POST() {
  // Client-side will handle removing the token
  return NextResponse.json({ message: 'Logged out successfully' })
}
