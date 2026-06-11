'use client'

import { useEffect, useState } from 'react'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

const API = 'http://localhost:8000/api/comparison'

type TableRow = { asset: string; roi: string; duration: string; aiPrediction: string }
type ROIRow = { asset: string; roi: number }
type ProjectionRow = { month: string; gold: number | null; stocks: number | null; realEstate: number | null }
type ConfidenceRow = { asset: string; confidence: string; score: number; change: string }

export default function ComparisonPage() {

  const [tableData, setTableData] = useState<TableRow[]>([])
  const [roiData, setRoiData] = useState<ROIRow[]>([])
  const [projectionData, setProjectionData] = useState<ProjectionRow[]>([])
  const [confidenceData, setConfidenceData] = useState<ConfidenceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true)
        const [table, roi, proj, conf] = await Promise.all([
          fetch(`${API}/table`).then(r => r.json()),
          fetch(`${API}/roi`).then(r => r.json()),
          fetch(`${API}/projection`).then(r => r.json()),
          fetch(`${API}/confidence`).then(r => r.json()),
        ])
        if (table.success) setTableData(table.data)
        if (roi.success) setRoiData(roi.data)
        if (proj.success) setProjectionData(proj.data)
        if (conf.success) setConfidenceData(conf.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load comparison data')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
        <div className="text-[#F59E0B] text-xl animate-pulse">Loading comparison data...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-[#F3F4F6] mb-2">Investment Comparison</h1>
        <p className="text-[#6B7280]">Compare asset classes side by side</p>
        {error && <p className="text-red-500 mt-2 bg-red-500/10 p-2 rounded">{error}</p>}
      </div>

      {/* Table */}
      <div className="bg-[#1a1a1a] border border-[#1F2937] rounded-lg overflow-hidden">
        <div className="p-6 border-b border-[#1F2937]">
          <h2 className="text-2xl font-bold text-[#F3F4F6]">Comparison Table</h2>
        </div>

        <table className="w-full">
          <thead className="bg-[#0a0a0a] border-b border-[#1F2937]">
            <tr>
              <th className="px-6 py-4 text-left text-[#6B7280]">Asset</th>
              <th className="px-6 py-4 text-left text-[#6B7280]">ROI %</th>
              <th className="px-6 py-4 text-left text-[#6B7280]">Duration</th>
              <th className="px-6 py-4 text-left text-[#6B7280]">AI Prediction</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, i) => (
              <tr key={i} className="border-b border-[#1F2937]">
                <td className="px-6 py-4 text-[#F3F4F6]">{row.asset}</td>
                <td className="px-6 py-4 text-[#10B981]">{row.roi}</td>
                <td className="px-6 py-4 text-[#F3F4F6]">{row.duration}</td>
                <td className="px-6 py-4 text-[#10B981]">{row.aiPrediction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ROI Chart */}
        <div className="bg-[#1a1a1a] border border-[#1F2937] rounded-lg p-6">
          <h2 className="text-2xl font-bold text-[#F3F4F6] mb-4">ROI Comparison</h2>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={roiData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
              <XAxis dataKey="asset" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip />
              <Bar dataKey="roi" fill="#F59E0B" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* AI Projection */}
        <div className="bg-[#1a1a1a] border border-[#1F2937] rounded-lg p-6">
          <h2 className="text-2xl font-bold text-[#F3F4F6] mb-4">6-Month Price Projection</h2>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={projectionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
              <XAxis dataKey="month" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip />
              <Line type="monotone" dataKey="gold" stroke="#F59E0B" />
              <Line type="monotone" dataKey="stocks" stroke="#10B981" />
              <Line type="monotone" dataKey="realEstate" stroke="#3B82F6" />
            </LineChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* AI Confidence */}
      <div className="bg-[#1a1a1a] border border-[#1F2937] rounded-lg p-6">
        <h2 className="text-2xl font-bold text-[#F3F4F6] mb-6">AI Confidence Levels</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {confidenceData.map((item, i) => (
            <div key={i} className="bg-[#0a0a0a] border border-[#1F2937] p-4 rounded-lg">
              <h3 className="text-[#F3F4F6]">{item.asset}</h3>
              <p className="text-[#6B7280]">{item.confidence}</p>
              <div className="w-full bg-[#1a1a1a] h-3 mt-2 rounded-full">
                <div
                  className="bg-gradient-to-r from-[#F59E0B] to-[#10B981] h-full"
                  style={{ width: `${item.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
