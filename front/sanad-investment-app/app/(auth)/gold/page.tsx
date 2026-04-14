'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// ────────────────────────────────────────────────
// Types
type HistoricalData = {
  date: string
  open: number
  close: number
  volume: number
}

type PriceData = {
  month: string
  price: number
}

type VolatilityData = {
  month: string
  volatility: number
}

// ────────────────────────────────────────────────
// بيانات مؤقتة (fallback / mock)
const mockHistoricalData: HistoricalData[] = [
  { date: '2025-11', open: 1920.5, close: 1935.2, volume: 2.1 },
  { date: '2025-12', open: 1935.2, close: 1945.8, volume: 1.9 },
  { date: '2026-01', open: 1945.8, close: 1950.2, volume: 2.3 },
  { date: '2026-02', open: 1950.2, close: 1925.5, volume: 2.5 },
  { date: '2026-03', open: 1925.5, close: 1948.3, volume: 2.0 },
]

const mockPriceData: PriceData[] = [
  { month: 'Nov', price: 1920 },
  { month: 'Dec', price: 1935 },
  { month: 'Jan', price: 1950 },
  { month: 'Feb', price: 1925 },
  { month: 'Mar', price: 1948 },
]

const mockVolatilityData: VolatilityData[] = [
  { month: 'Nov', volatility: 1.2 },
  { month: 'Dec', volatility: 0.8 },
  { month: 'Jan', volatility: 1.5 },
  { month: 'Feb', volatility: 2.1 },
  { month: 'Mar', volatility: 1.3 },
]

// ────────────────────────────────────────────────
export default function GoldPage() {
  // حالات البيانات الديناميكية
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>(mockHistoricalData)
  const [priceData, setPriceData] = useState<PriceData[]>(mockPriceData)
  const [volatilityData, setVolatilityData] = useState<VolatilityData[]>(mockVolatilityData)

  // Current Price و Daily Change بدون قيم افتراضية
  const [currentPrice, setCurrentPrice] = useState<number | null>(null)
  const [dailyChangePercent, setDailyChangePercent] = useState<number | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const historicalChartData = historicalData.length ? historicalData : mockHistoricalData
  const goldPriceChartData = priceData.length ? priceData : mockPriceData
  const volatilityChartData = volatilityData.length ? volatilityData : mockVolatilityData

  // ────────────────────────────────────────────────
  // UseEffect جاهز للربط بالـ backend / API
  useEffect(() => {/*
    async function fetchGoldData() {
      try {
        setLoading(true)
        setError(null)

        // TODO: غيّري الرابط ده للـ endpoint الحقيقي
        const res = await fetch('/api/gold/analysis')
        if (!res.ok) throw new Error('فشل جلب بيانات الذهب')

        const data = await res.json()

        // تحديث الـ state بناءً على البيانات القادمة من الـ API
        setHistoricalData(data.historical || mockHistoricalData)
        setPriceData(data.priceTrend || mockPriceData)
        setVolatilityData(data.volatility || mockVolatilityData)

        setCurrentPrice(data.currentPrice ?? null)
        setDailyChangePercent(data.dailyChangePercent ?? null)
      } catch (err: any) {
        setError(err.message || 'حدث خطأ أثناء جلب البيانات')
      } finally {
        setLoading(false)
      }
    }

    fetchGoldData()*/
  }, [])

  // ────────────────────────────────────────────────
  if (loading) return <div className="text-center py-20 text-[#F3F4F6]">جاري التحميل...</div>
  if (error) return <div className="text-center py-20 text-red-400">{error}</div>

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-[#F3F4F6] mb-2">Gold Investment Analysis</h1>
        <p className="text-[#6B7280]">Track and analyze gold market trends</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#1a1a1a] border border-[#1F2937] rounded-lg p-6">
          <p className="text-[#6B7280] text-sm font-medium mb-2">Current Price</p>
          <p className="text-4xl font-bold text-[#F3F4F6]">
            {currentPrice !== null ? `$${currentPrice.toFixed(2)}` : ''}
          </p>
          <p className="text-[#6B7280] text-sm mt-2">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
        <div className="bg-[#1a1a1a] border border-[#1F2937] rounded-lg p-6">
          <p className="text-[#6B7280] text-sm font-medium mb-2">Daily Change %</p>
          <p className="text-4xl font-bold text-[#F3F4F6]">
            {dailyChangePercent !== null ? `${dailyChangePercent >= 0 ? '+' : ''}${dailyChangePercent.toFixed(2)}%` : ''}
          </p>
        </div>
      </div>

      {/* Historical Data Table */}
      <div className="bg-[#1a1a1a] border border-[#1F2937] rounded-lg p-6">
        <h2 className="text-2xl font-bold text-[#F3F4F6] mb-4">Historical Data</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1F2937]">
                <th className="px-4 py-3 text-left text-[#6B7280] font-medium">Date</th>
                <th className="px-4 py-3 text-left text-[#6B7280] font-medium">Open</th>
                <th className="px-4 py-3 text-left text-[#6B7280] font-medium">Close</th>
                <th className="px-4 py-3 text-left text-[#6B7280] font-medium">Volume (M)</th>
              </tr>
            </thead>
            <tbody>
              {historicalChartData.map((row, i) => (
                <tr key={i} className="border-b border-[#1F2937] hover:bg-[#0a0a0a]">
                  <td className="px-4 py-3 text-[#F3F4F6]">{row.date}</td>
                  <td className="px-4 py-3 text-[#F3F4F6]">${row.open.toFixed(2)}</td>
                  <td className={`px-4 py-3 font-bold ${row.close >= row.open ? 'text-[#10B981]' : 'text-red-400'}`}>
                    ${row.close.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-[#F3F4F6]">{row.volume}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#1a1a1a] border border-[#1F2937] rounded-lg p-6">
          <h3 className="text-xl font-bold text-[#F3F4F6] mb-4">Historical Gold Prices</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={goldPriceChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
              <XAxis dataKey="month" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #1F2937' }} labelStyle={{ color: '#F3F4F6' }} />
              <Line type="monotone" dataKey="price" stroke="#F59E0B" strokeWidth={2} dot={{ fill: '#F59E0B' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#1a1a1a] border border-[#1F2937] rounded-lg p-6">
          <h3 className="text-xl font-bold text-[#F3F4F6] mb-4">Monthly Volatility</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={volatilityChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
              <XAxis dataKey="month" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #1F2937' }} labelStyle={{ color: '#F3F4F6' }} />
              <Bar dataKey="volatility" fill="#F59E0B" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}