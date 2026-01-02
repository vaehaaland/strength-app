'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Dumbbell, User, LogOut } from 'lucide-react'
import { useAuth } from '@/lib/context/AuthContext'

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout, isLoading } = useAuth()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  // Don't show navigation on login/register pages
  if (pathname === '/login' || pathname === '/register') {
    return null
  }

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-2 font-bold text-xl">
                <Dumbbell className="h-6 w-6" />
                <span>Strength Tracker</span>
              </Link>
              <div className="hidden sm:flex space-x-4">
                <Link 
                  href="/workouts" 
                  className="px-3 py-2 rounded-md text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Workouts
                </Link>
                <Link 
                  href="/programs" 
                  className="px-3 py-2 rounded-md text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Programs
                </Link>
                <Link 
                  href="/stats" 
                  className="px-3 py-2 rounded-md text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Stats
                </Link>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {!isLoading && (
                <>
                  {user ? (
                    <>
                      <div className="hidden sm:flex items-center space-x-2 text-sm text-zinc-700 dark:text-zinc-300">
                        <User className="h-4 w-4" />
                        <span>{user.name || user.email}</span>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        <span className="hidden sm:inline">Logout</span>
                      </button>
                    </>
                  ) : (
                    <Link
                      href="/login"
                      className="px-3 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                      Login
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 pb-safe z-50">
        <div className="grid grid-cols-3 gap-1 p-2">
          <Link 
            href="/workouts" 
            className="flex flex-col items-center justify-center py-2 px-3 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Dumbbell className="h-5 w-5 mb-1" />
            Workouts
          </Link>
          <Link 
            href="/programs" 
            className="flex flex-col items-center justify-center py-2 px-3 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <svg className="h-5 w-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Programs
          </Link>
          <Link 
            href="/stats" 
            className="flex flex-col items-center justify-center py-2 px-3 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <svg className="h-5 w-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
            Stats
          </Link>
        </div>
      </div>
    </>
  )
}
