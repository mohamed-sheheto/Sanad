'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'


// fallback data
const mockMarketTrendData = [
  { month: 'Jan', value: 3500 },
  { month: 'Feb', value: 3200 },
  { month: 'Mar', value: 3800 },
  { month: 'Apr', value: 4200 },
  { month: 'May', value: 4000 },
  { month: 'Jun', value: 4050 },
]

const mockCompanyData = [
  { name: 'Apple Inc.', performance: 28.5 },
  { name: 'Tesla Inc.', performance: 22.3 },
  { name: 'Microsoft Corp.', performance: 24.1 },
  { name: 'Netflix Inc.', performance: -5.2 },
  { name: 'Meta Platforms', performance: -8.3 },
]

// fallback metrics
const mockMetrics = {
  marketVolatility: 12.5,
  ytdGrowth: 8.2,
  sp500: 15.2
}

export default function StocksPage() {

  const [marketTrendData, setMarketTrendData] = useState(mockMarketTrendData)
  const [companyData, setCompanyData] = useState(mockCompanyData)
  const [metrics, setMetrics] = useState(mockMetrics)

  const [loading, setLoading] = useState(false)


  useEffect(() => {/*

    async function fetchStocksData() {

      try {

        setLoading(true)

        const res = await fetch('/api/stocks')

        if (!res.ok) {
          throw new Error('API not ready')
        }

        const data = await res.json()

        if (data.marketTrend) {
          setMarketTrendData(data.marketTrend)
        }

        if (data.companies) {
          setCompanyData(data.companies)
        }

        if (data.metrics) {
          setMetrics(data.metrics)
        }

      } catch (err) {

        console.log('Using fallback stocks data')

      } finally {

        setLoading(false)

      }

    }

    fetchStocksData()*/

  }, [])


  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-[#F3F4F6] mb-2">Stocks Analysis</h1>
        <p className="text-[#6B7280]">Monitor market performance and company trends</p>
      </div>


      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div className="bg-[#1a1a1a] border border-[#1F2937] rounded-lg p-6">
          <p className="text-[#6B7280] text-sm font-medium mb-2">Market Volatility</p>
          <p className="text-4xl font-bold text-[#F3F4F6]">{metrics.marketVolatility}%</p>
          <p className="text-[#6B7280] text-sm mt-2">Current market volatility index</p>
        </div>

        <div className="bg-[#1a1a1a] border border-[#1F2937] rounded-lg p-6">
          <p className="text-[#6B7280] text-sm font-medium mb-2">Year-to-Date Growth</p>
          <p className="text-4xl font-bold text-[#10B981]">+{metrics.ytdGrowth}%</p>
          <p className="text-[#6B7280] text-sm mt-2">Portfolio growth since Jan 1st</p>
        </div>

      </div>


      {/* Market Trends Section */}
      <div className="bg-[#1a1a1a] border border-[#1F2937] rounded-lg p-6">

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-[#F3F4F6]">Market Trends</h2>
          <span className="text-[#10B981] font-bold">
            S&P 500 +{metrics.sp500}%
          </span>
        </div>

        <p className="text-[#6B7280] text-sm mb-4">Last 6 months performance</p>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={marketTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
            <XAxis dataKey="month" stroke="#6B7280" />
            <YAxis stroke="#6B7280" />
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
              dot={{ fill: '#F59E0B' }}
            />
          </LineChart>
        </ResponsiveContainer>

      </div>


      {/* Company Performance */}
      <div className="bg-[#1a1a1a] border border-[#1F2937] rounded-lg p-6">

        <h2 className="text-2xl font-bold text-[#F3F4F6] mb-6">Company Performance</h2>

        <div className="space-y-4">

          {companyData.map((company, i) => (

            <div key={i} className="space-y-2">

              <div className="flex items-center justify-between">
                <span className="text-[#F3F4F6] font-medium">{company.name}</span>

                <span className={company.performance > 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}>
                  {company.performance > 0 ? '+' : ''}{company.performance}%
                </span>
              </div>

              <div className="w-full bg-[#0a0a0a] rounded-full h-2">

                <div
                  className={company.performance > 0 ? 'bg-[#10B981]' : 'bg-[#EF4444]'}
                  style={{
                    width: `${Math.min(Math.abs(company.performance) * 4, 100)}%`,
                  }}
                />

              </div>

            </div>

          ))}

        </div>

      </div>


      {/* Top Performers Chart */}
      <div className="bg-[#1a1a1a] border border-[#1F2937] rounded-lg p-6">

        <h2 className="text-2xl font-bold text-[#F3F4F6] mb-4">Top vs Bottom Performers</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div>

            <h3 className="text-lg font-bold text-[#10B981] mb-4">Top Performers</h3>

            <div className="space-y-3">

              {companyData.slice(0, 3).map((company, i) => (

                <div key={i} className="flex items-center justify-between p-3 bg-[#0a0a0a] rounded-lg">

                  <span className="text-[#F3F4F6]">{company.name}</span>

                  <span className="text-[#10B981] font-bold">
                    +{company.performance}%
                  </span>

                </div>

              ))}

            </div>

          </div>


          <div>

            <h3 className="text-lg font-bold text-[#EF4444] mb-4">Bottom Performers</h3>

            <div className="space-y-3">

              {companyData.slice(3).map((company, i) => (

                <div key={i} className="flex items-center justify-between p-3 bg-[#0a0a0a] rounded-lg">

                  <span className="text-[#F3F4F6]">{company.name}</span>

                  <span className="text-[#EF4444] font-bold">
                    {company.performance}%
                  </span>

                </div>

              ))}

            </div>

          </div>

        </div>

      </div>

    </div>
  )
}
