'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

interface AuthContextType {
  isLoggedIn: boolean
  login: () => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('isLoggedIn') : null
    setIsLoggedIn(stored === 'true')
    setIsLoading(false)
  }, [])

  const login = () => {
    setIsLoggedIn(true)
    if (typeof window !== 'undefined') {
      localStorage.setItem('isLoggedIn', 'true')
    }
  }

  const logout = () => {
    setIsLoggedIn(false)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('isLoggedIn')
    }
  }

  if (isLoading) {
    return null
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
