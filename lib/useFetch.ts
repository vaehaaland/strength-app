'use client'

import { useAuth } from './context/AuthContext'

export function useFetch() {
  const { token } = useAuth()

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers)
    
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }

    return fetch(url, {
      ...options,
      headers,
    })
  }

  return fetchWithAuth
}
