'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

interface AuthContextType {
  isLoggedIn: boolean
  user: any
  login: (userData: any, token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('isLoggedIn')
    const storedUser = localStorage.getItem('user')

    if (stored === 'true' && storedUser) {
      setIsLoggedIn(true)
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const login = (userData: any, token: string) => {
    setIsLoggedIn(true)
    setUser(userData)
    localStorage.setItem('isLoggedIn', 'true')
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('token', token)
  }

  const logout = () => {
    setIsLoggedIn(false)
    setUser(null)
    // نمسح بيانات الجلسة الحالية فقط
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    // لاحظ: لم نمسح 'login_history' لكي تظل الإيميلات محفوظة في صفحة اللوج إن
  }

  if (isLoading) return null

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}