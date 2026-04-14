'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Link from 'next/link'
type GoldData = {
  month: string
  value: number
}
type StocksData = {
  month: string
  value: number
}
type RealEstateData = {
  asset: string
  roi: number
}
// بيانات الاحتياط (Fallback)
const mockGoldData = [
  { month: 'Nov', value: 1920 },
  { month: 'Dec', value: 1935 },
  { month: 'Jan', value: 1950 },
  { month: 'Feb', value: 1925 },
  { month: 'Mar', value: 1945 },
]
const mockStocksData = [
  { month: 'Jan', value: 4800 },
  { month: 'Feb', value: 4950 },
  { month: 'Mar', value: 5100 },
  { month: 'Apr', value: 5050 },
  { month: 'May', value: 5200 },
  { month: 'Jun', value: 5350 },
]
const mockRealEstateData = [
  { asset: 'Downtown', roi: 8.5 },
  { asset: 'Marina', roi: 7.2 },
  { asset: 'Palm', roi: 6.8 },
]
export default function DashboardPage() {

  const [goldData, setGoldData] = useState<GoldData[]>([])
  const [stocksData, setStocksData] = useState<StocksData[]>([])
  const [realEstateData, setRealEstateData] = useState<RealEstateData[]>([])
  const [investmentAmount, setInvestmentAmount] = useState('')
  const [duration, setDuration] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const goldChartData = goldData.length ? goldData : mockGoldData
  const stocksChartData = stocksData.length ? stocksData : mockStocksData
  const realEstateChartData = realEstateData.length ? realEstateData : mockRealEstateData

  useEffect(() => {
    const handleAuthAndFetch = async () => {
      try {
        setLoading(true)

        // 1. لقط التوكن من URL (لو راجع من جوجل)

        const urlParams = new URLSearchParams(window.location.search)
        const urlToken = urlParams.get('token')
        if (urlToken) {
          localStorage.setItem('jwt', urlToken) // بنسميه jwt عشان يطابق الباكيند
          // تنظيف الـ URL من التوكن للمنظر العام
          window.history.replaceState({}, document.title, window.location.pathname)
        }
        // 2. الحصول على التوكن من التخزين
        const token = localStorage.getItem('jwt')
        if (!token) {
          setError("لم يتم العثور على صلاحية دخول، يرجى تسجيل الدخول")
          setLoading(false)
          return
        }
        // 3. جلب البيانات من السيرفر

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
        const [gRes, sRes, rRes] = await Promise.all([
          fetch('http://localhost:8000/api/gold-trend', { headers }),
          fetch('http://localhost:8000/api/sp500-trend', { headers }),
          fetch('http://localhost:8000/api/real-estate-roi', { headers }),

        ])
        // لو التوكن قديم أو غير صحيح (401)

        if (gRes.status === 401 || sRes.status === 401 || rRes.status === 401) {
          localStorage.removeItem('jwt')
          window.location.href = '/login'
          return
        }
        const gold = await gRes.json()
        const stocks = await sRes.json()
        const realEstate = await rRes.json()
        setGoldData(gold.data || gold)
        setStocksData(stocks.data || stocks)
        setRealEstateData(realEstate.data || realEstate)
      } catch (err: any) {
        console.error("Fetch error:", err)
        setError(err.message || 'حدث خطأ أثناء جلب البيانات')

      } finally {
        setLoading(false)

      }
    }
    handleAuthAndFetch()

  }, [])
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
      <div className="text-[#F59E0B] text-xl animate-pulse">جاري تحميل بيانات المحفظة...</div>
    </div>
  )
  return (
    <div className="space-y-8 p-4 md:p-8 bg-[#0a0a0a] min-h-screen text-[#F3F4F6]">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-[#F3F4F6] mb-2">Investment Overview</h1>
        <p className="text-[#6B7280]">Manage and analyze your investment portfolio</p>
        {error && <p className="text-red-500 mt-2 bg-red-500/10 p-2 rounded">{error}</p>}
      </div>
      {/* Investment Input Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#1a1a1a] border border-[#1F2937] rounded-lg p-6">
          <label className="block text-sm font-medium text-[#F3F4F6] mb-2">
            Investment Amount
          </label>
          <input
            type="number"
            value={investmentAmount}
            onChange={(e) => setInvestmentAmount(e.target.value)}
            placeholder="$0"
            className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#1F2937] rounded-lg text-[#F3F4F6] placeholder-[#6B7280] focus:outline-none focus:border-[#F59E0B] transition"
          />
        </div>
        <div className="bg-[#1a1a1a] border border-[#1F2937] rounded-lg p-6">
          <label className="block text-sm font-medium text-[#F3F4F6] mb-2">
            Duration (Months)
          </label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="12"
            className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#1F2937] rounded-lg text-[#F3F4F6] placeholder-[#6B7280] focus:outline-none focus:border-[#F59E0B] transition"
          />
        </div>
      </div>
      {/* Investment Options */}
      <div>
        <h2 className="text-2xl font-bold text-[#F3F4F6] mb-4">Investment Options</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Gold Card */}
          <div className="bg-[#1a1a1a] border border-[#1F2937] rounded-lg overflow-hidden hover:border-[#F59E0B] transition min-h-[320px] flex flex-col">
            <div className="h-32 bg-gradient-to-br from-[#F59E0B]/20 to-[#1a1a1a] flex items-center justify-center">
              <div className="text-5xl">🏆</div>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <h3 className="text-xl font-bold text-[#F3F4F6] mb-2">Gold</h3>
              <p className="text-[#6B7280] text-sm flex-1 mb-4">
                Invest in precious metals for long-term wealth preservation
              </p>
              <Link href="/gold" className="bg-[#F59E0B] text-black px-4 py-2 rounded hover:bg-[#FBBF24] mt-auto text-center">
                View Details
              </Link>
            </div>
          </div>
          {/* Stocks Card */}
          <div className="bg-[#1a1a1a] border border-[#1F2937] rounded-lg overflow-hidden hover:border-[#F59E0B] transition min-h-[320px] flex flex-col">
            <div className="h-32 bg-gradient-to-br from-[#10B981]/20 to-[#1a1a1a] flex items-center justify-center">
              <div className="text-5xl">📈</div>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <h3 className="text-xl font-bold text-[#F3F4F6] mb-2">Stocks</h3>
              <p className="text-[#6B7280] text-sm flex-1 mb-4">
                Diversify your portfolio with equity market investments
              </p>
              <Link href="/stocks" className="bg-[#F59E0B] text-black px-4 py-2 rounded hover:bg-[#FBBF24] mt-auto text-center">
                View Details
              </Link>
            </div>
          </div>
          {/* Real Estate Card */}
          <div className="bg-[#1a1a1a] border border-[#1F2937] rounded-lg overflow-hidden hover:border-[#F59E0B] transition min-h-[320px] flex flex-col">
            <div className="h-32 bg-gradient-to-br from-[#3B82F6]/20 to-[#1a1a1a] flex items-center justify-center">
              <div className="text-5xl">🏘</div>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <h3 className="text-xl font-bold text-[#F3F4F6] mb-2">Real Estate</h3>
              <p className="text-[#6B7280] text-sm flex-1 mb-4">
                Build wealth through property investment opportunities
              </p>
              <Link href="/real-estate" className="bg-[#F59E0B] text-black px-4 py-2 rounded hover:bg-[#FBBF24] mt-auto text-center">
                View Details
              </Link>
            </div>
          </div>
        </div>
      </div>
      {/* Investment Trends */}
      <div>
        <h2 className="text-2xl font-bold text-[#F3F4F6] mb-4">Investment Trends</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Gold Trend */}
          <div className="bg-[#1a1a1a] border border-[#1F2937] rounded-lg p-6 min-h-[320px]">
            <h3 className="text-lg font-bold text-[#F3F4F6] mb-4">Gold Price Trend</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={goldChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #1F2937' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Line type="monotone" dataKey="value" stroke="#F59E0B" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {/* Stocks Trend */}
          <div className="bg-[#1a1a1a] border border-[#1F2937] rounded-lg p-6 min-h-[320px]">
            <h3 className="text-lg font-bold text-[#F3F4F6] mb-4">S&P 500 Index</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={stocksChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #1F2937' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Real Estate ROI */}
          <div className="bg-[#1a1a1a] border border-[#1F2937] rounded-lg p-6 min-h-[320px]">
            <h3 className="text-lg font-bold text-[#F3F4F6] mb-4">Real Estate ROI</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={realEstateChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis dataKey="asset" stroke="#6B7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #1F2937' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Bar dataKey="roi" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}