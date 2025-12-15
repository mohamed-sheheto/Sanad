"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const data = [
  { month: "Jan", value: 10 },
  { month: "Feb", value: 20 },
  { month: "Mar", value: 15 },
  { month: "Apr", value: 25 },
  { month: "May", value: 20 },
  { month: "Jun", value: 30 },
]

export function ChartComponent() {
  return (
    <section className="w-full py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center">
        {/* Title */}
        <h2 className="text-2xl font-bold text-white mb-8">Portfolio Growth Simulation</h2>

        {/* Growth Stats */}
        <div className="mb-8">
          <div className="text-5xl font-bold text-green-500 mb-2">+15%</div>
          <div className="text-sm text-gray-400">
            Last 6 months <span className="text-green-500">+15%</span>
          </div>
        </div>

        {/* Chart */}
        <div className="w-full h-64 bg-neutral-900 rounded-lg p-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
              <XAxis dataKey="month" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip
                contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #666" }}
                labelStyle={{ color: "#fff" }}
              />
              <Line type="monotone" dataKey="value" stroke="#888" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  )
}
