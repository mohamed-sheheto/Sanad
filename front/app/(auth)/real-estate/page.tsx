'use client'

import Image from 'next/image'
import { useState, useEffect, useCallback } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

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

const ML_SERVICE = 'http://localhost:8000/api/assets'

const getCityImagePath = (city: string): string => {
  const map: Record<string, string> = {
    'Cairo': 'cairo.png',
    'Giza': 'giza.png',
    'Alexandria': 'alexandria.png',
    'New Cairo': 'newCairo.png',
    'Sheikh Zayed': 'sheikhZayed.png',
    '6th of October': '6thOctober.png',
    'North Coast': 'northCoast.png',
    'Madinaty': 'madinaty.png',
  }
  return `/cities/${map[city] || 'cairo.png'}`
}

export default function RealEstatePage() {
  const [selectedCity, setSelectedCity] = useState('Cairo')
  const [selectedPropertyType, setSelectedPropertyType] = useState('All Types')

  const [priceData, setPriceData] = useState<PriceTrend[]>(mockPriceData)
  const [propertyTypeData, setPropertyTypeData] = useState<PropertyTypeData[]>(mockPropertyTypeData)
  const [marketStats, setMarketStats] = useState<MarketStats>({
    averageROI: 8.5,
    marketGrowth: 12.2
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [predictValue, setPredictValue] = useState('')
  const [predictionResult, setPredictionResult] = useState<number | null>(null)
  const [predictLoading, setPredictLoading] = useState(false)

  const fetchRealEstateData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch(`${ML_SERVICE}/realestate/history?city=${encodeURIComponent(selectedCity)}`)

      if (!res.ok) throw new Error('API not ready')

      const data = await res.json()

      if (data.priceTrend) setPriceData(data.priceTrend)
      if (data.propertyTypes) setPropertyTypeData(data.propertyTypes)
      if (data.marketStats) setMarketStats(data.marketStats)

    } catch (err) {
      console.log('Using mock real estate data')
    } finally {
      setLoading(false)
    }
  }, [selectedCity])

  useEffect(() => {
    fetchRealEstateData()
  }, [fetchRealEstateData])

  const handlePredict = async () => {
    const value = parseFloat(predictValue)
    if (isNaN(value) || value <= 0) return

    setPredictLoading(true)
    setPredictionResult(null)

    try {
      const res = await fetch(`${ML_SERVICE}/realestate/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          value,
          city: selectedCity,
          property_type: selectedPropertyType === 'All Types' ? 'Apartment' : selectedPropertyType,
        }),
      })

      if (!res.ok) throw new Error('Prediction failed')

      const json = await res.json()
      setPredictionResult(json.data?.prediction ?? json.prediction)
    } catch (err) {
      console.error('Prediction error:', err)
    } finally {
      setPredictLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-20 text-[#F3F4F6]">جاري تحميل بيانات العقارات...</div>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-[#F3F4F6] mb-2">Real Estate Analysis</h1>
        <p className="text-[#6B7280]">Analyze property investment opportunities</p>
      </div>

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
          <select
            value={selectedPropertyType}
            onChange={(e) => setSelectedPropertyType(e.target.value)}
            className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#1F2937] rounded-lg text-[#F3F4F6] focus:outline-none focus:border-[#F59E0B]"
          >
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1a1a1a] border border-[#1F2937] rounded-lg p-6">
          <p className="text-[#6B7280] text-sm font-medium mb-2">Average ROI</p>
          <p className="text-4xl font-bold text-[#F3F4F6]">{marketStats.averageROI}%</p>
          <p className="text-[#10B981] text-sm mt-2">Predicted annual return</p>
        </div>
        <div className="bg-[#1a1a1a] border border-[#1F2937] rounded-lg p-6">
          <p className="text-[#6B7280] text-sm font-medium mb-2">Market Growth</p>
          <p className="text-4xl font-bold text-[#10B981]">+{marketStats.marketGrowth}%</p>
          <p className="text-[#6B7280] text-sm mt-2">Year-over-year growth</p>
        </div>
        <div className="bg-[#1a1a1a] border border-[#1F2937] rounded-lg p-6">
          <p className="text-[#6B7280] text-sm font-medium mb-2">AI Price Prediction</p>
          <div className="flex gap-2">
            <input
              type="number"
              value={predictValue}
              onChange={(e) => setPredictValue(e.target.value)}
              placeholder="Price per m²"
              className="w-36 px-3 py-2 bg-[#0a0a0a] border border-[#1F2937] rounded-lg text-[#F3F4F6] text-sm focus:outline-none focus:border-[#F59E0B]"
            />
            <button
              onClick={handlePredict}
              disabled={predictLoading}
              className="px-4 py-2 bg-[#F59E0B] text-black font-medium rounded-lg hover:bg-[#D97706] disabled:opacity-50 text-sm"
            >
              {predictLoading ? '...' : 'Predict ROI'}
            </button>
          </div>
          {predictionResult !== null && (
            <p className="text-[#10B981] text-lg font-bold mt-2">
              ROI: {predictionResult > 0 ? '+' : ''}{predictionResult}%
            </p>
          )}
        </div>
      </div>

      <div className="bg-[#1a1a1a] border border-[#1F2937] rounded-lg p-6">
        <div className="relative w-full min-h-[400px] rounded-lg overflow-hidden">
          <Image
            src={getCityImagePath(selectedCity)}
            alt={`Map of ${selectedCity}`}
            fill
            className="object-cover"
          />
        </div>
      </div>

      <div className="bg-[#1a1a1a] border border-[#1F2937] rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-[#F3F4F6]">Price per m² Trend</h2>
          <span className="text-[#10B981] font-bold">+{marketStats.marketGrowth}%</span>
        </div>
        <p className="text-[#6B7280] text-sm mb-4">Last 12 months in {selectedCity}</p>

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
