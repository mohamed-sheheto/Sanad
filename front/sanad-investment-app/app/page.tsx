'use client'

import { useAuth } from '@/components/auth-context'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const chartData = [
  { month: 'Jan', value: 0 },
  { month: 'Feb', value: 2 },
  { month: 'Mar', value: 1.5 },
  { month: 'Apr', value: 4 },
  { month: 'May', value: 3.5 },
  { month: 'Jun', value: 15 },
]

export default function LoginPage() {
  const { login, isLoggedIn } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (isLoggedIn) {
      router.push('/dashboard')
    }
  }, [isLoggedIn, router])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    login()
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#F59E0B]">Sanad</h1>
          <p className="text-[#6B7280] mt-2">Your AI-Powered Investment Guide</p>
        </div>

        {/* Hero Image */}
        <div className="rounded-lg mb-8 border border-[#1F2937] h-48 overflow-hidden">
          <img 
            src="/images/hero-sanad-cover.png" 
            alt="Investment themes: gold, real estate, and stocks"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Welcome Text */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-[#F3F4F6] mb-3">
            Welcome to Sanad
          </h2>
          <p className="text-[#6B7280] mb-6">
            Your AI-Powered Investment Guide
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-[#F3F4F6] mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#1F2937] rounded-lg text-[#F3F4F6] placeholder-[#6B7280] focus:outline-none focus:border-[#F59E0B] transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#F3F4F6] mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#1F2937] rounded-lg text-[#F3F4F6] placeholder-[#6B7280] focus:outline-none focus:border-[#F59E0B] transition"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#F59E0B] hover:bg-[#FBBF24] text-[#111827] font-bold py-3 rounded-lg transition duration-200"
          >
            Login
          </button>
        </form>

        {/* Google Button */}
        <button
          onClick={handleLogin}
          className="w-full bg-[#F59E0B] hover:bg-[#FBBF24] text-[#111827] font-bold py-3 rounded-lg transition duration-200 mb-6"
        >
          Continue with Google
        </button>

        {/* Quick Login Button */}
        <button
          onClick={handleLogin}
          className="w-full bg-[#F59E0B] hover:bg-[#FBBF24] text-[#111827] font-bold py-3 rounded-lg transition duration-200 mb-8"
        >
          Get Started
        </button>

        {/* Portfolio Growth Simulation */}
        <div className="bg-[#1a1a1a] border border-[#1F2937] rounded-lg p-6">
          <h3 className="text-sm font-bold text-[#F3F4F6] mb-4">
            Portfolio Growth Simulation
          </h3>
          <div className="mb-4">
            <p className="text-[#F59E0B] text-2xl font-bold">+15%</p>
            <p className="text-[#6B7280] text-xs">Last 6 Months +15%</p>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
              <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #1F2937',
                }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#F59E0B"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
