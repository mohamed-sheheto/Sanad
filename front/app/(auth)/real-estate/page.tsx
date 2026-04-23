'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// ────────────────────────────────────────────────
// Types
type PriceTrend = {
  month: string
  price: number
}

type PropertyTypeData = {
  type: string
  avgPrice: number
}

type MarketStats = {
  averageROI: number
  marketGrowth: number
}

// ────────────────────────────────────────────────
// Mock Data (fallback)
const mockPriceData: PriceTrend[] = [
  { month: 'Nov', price: 4200 },
  { month: 'Dec', price: 4350 },
  { month: 'Jan', price: 4400 },
  { month: 'Feb', price: 4550 },
  { month: 'Mar', price: 4420 },
  { month: 'Apr', price: 4620 },
]

const mockPropertyTypeData: PropertyTypeData[] = [
  { type: 'Apartment', avgPrice: 1500000 },
  { type: 'Villa', avgPrice: 5000000 },
  { type: 'Chalet', avgPrice: 2200000 },
  { type: 'Duplex', avgPrice: 2700000 },
  { type: 'Penthouse', avgPrice: 3200000 },
]

export default function RealEstatePage() {
  const [selectedCity, setSelectedCity] = useState('Cairo')

  // Dynamic States
  const [priceData, setPriceData] = useState<PriceTrend[]>(mockPriceData)
  const [propertyTypeData, setPropertyTypeData] = useState<PropertyTypeData[]>(mockPropertyTypeData)
  const [marketStats, setMarketStats] = useState<MarketStats>({
    averageROI: 8.5,
    marketGrowth: 12.2
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ────────────────────────────────────────────────
  // Fetch Data from Backend / AI
  useEffect(() => {/*
    async function fetchRealEstateData() {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch('/api/real-estate')

        if (!res.ok) throw new Error('API not ready yet')

        const data = await res.json()

        // Update states with real data
        if (data.priceTrend) setPriceData(data.priceTrend)
        if (data.propertyTypes) setPropertyTypeData(data.propertyTypes)
        if (data.marketStats) setMarketStats(data.marketStats)

      } catch (err) {
        console.log('Using mock real estate data')
        // Keep mock data as fallback
      } finally {
        setLoading(false)
      }
    }

    fetchRealEstateData()*/
  }, [])

  // ────────────────────────────────────────────────
  if (loading) {
    return <div className="text-center py-20 text-[#F3F4F6]">جاري تحميل بيانات العقارات...</div>
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-[#F3F4F6] mb-2">Real Estate Analysis</h1>
        <p className="text-[#6B7280]">Analyze property investment opportunities</p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#1a1a1a] border border-[#1F2937] rounded-lg p-4">
          <label className="block text-sm font-medium text-[#F3F4F6] mb-2">City</label>
          <select 
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#1F2937] rounded-lg text-[#F3F4F6] focus:outline-none focus:border-[#F59E0B]"
          >
            <option>Cairo</option>
            <option>Giza</option>
            <option>Alexandria</option>
            <option>New Cairo</option>
            <option>Sheikh Zayed</option>
            <option>6th of October</option>
            <option>North Coast</option>
            <option>Madinaty</option>
          </select>
        </div>
        <div className="bg-[#1a1a1a] border border-[#1F2937] rounded-lg p-4">
          <label className="block text-sm font-medium text-[#F3F4F6] mb-2">Property Type</label>
          <select className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#1F2937] rounded-lg text-[#F3F4F6] focus:outline-none focus:border-[#F59E0B]">
            <option>All Types</option>
            <option>Apartment</option>
            <option>Villa</option>
            <option>Duplex</option>
            <option>Chalet</option>
            <option>Townhouse</option>
            <option>Penthouse</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#1a1a1a] border border-[#1F2937] rounded-lg p-6">
          <p className="text-[#6B7280] text-sm font-medium mb-2">Average ROI</p>
          <p className="text-4xl font-bold text-[#F3F4F6]">{marketStats.averageROI}%</p>
          <p className="text-[#10B981] text-sm mt-2">+0.3% vs last month</p>
        </div>
        <div className="bg-[#1a1a1a] border border-[#1F2937] rounded-lg p-6">
          <p className="text-[#6B7280] text-sm font-medium mb-2">Market Growth</p>
          <p className="text-4xl font-bold text-[#10B981]">+{marketStats.marketGrowth}%</p>
          <p className="text-[#6B7280] text-sm mt-2">Year-over-year growth</p>
        </div>
      </div>

      {/* Map Placeholder */}
      <div className="bg-[#1a1a1a] border border-[#1F2937] rounded-lg p-6">
        <div className="w-full bg-gradient-to-br from-[#3B82F6]/10 to-[#1a1a1a] rounded-lg border border-[#1F2937] p-12 flex flex-col items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-6xl mb-4">🗺️</div>
            <p className="text-[#F3F4F6] font-medium">Interactive Map will be integrated with backend data</p>
          </div>
        </div>
      </div>

      {/* Price per m² Trend */}
      <div className="bg-[#1a1a1a] border border-[#1F2937] rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-[#F3F4F6]">Price per m² Trend</h2>
          <span className="text-[#10B981] font-bold">+5.2%</span>
        </div>
        <p className="text-[#6B7280] text-sm mb-4">Last 6 months in {selectedCity}</p>
        
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={priceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
            <XAxis dataKey="month" stroke="#6B7280" />
            <YAxis stroke="#6B7280" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #1F2937' }}
              labelStyle={{ color: '#F3F4F6' }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#10B981"
              strokeWidth={2}
              dot={{ fill: '#10B981' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Average Price by Property Type */}
      <div className="bg-[#1a1a1a] border border-[#1F2937] rounded-lg p-6">
        <h2 className="text-2xl font-bold text-[#F3F4F6] mb-4">Average Price by Property Type</h2>
        
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={propertyTypeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
            <XAxis dataKey="type" stroke="#6B7280" />
            <YAxis stroke="#6B7280" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #1F2937' }}
              labelStyle={{ color: '#F3F4F6' }}
              formatter={(value) => `${value.toLocaleString()} EGP`}
            />
            <Bar dataKey="avgPrice" fill="#F59E0B" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}