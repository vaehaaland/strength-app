'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/context/AuthContext'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isLoading } = useAuth()

  const publicRoutes = ['/login', '/register']
  const isPublicRoute = publicRoutes.includes(pathname)

  useEffect(() => {
    if (!isLoading) {
      if (!user && !isPublicRoute) {
        router.push('/login')
      } else if (user && isPublicRoute) {
        router.push('/')
      }
    }
  }, [user, isLoading, isPublicRoute, router, pathname])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
      </div>
    )
  }

  return <>{children}</>
}
