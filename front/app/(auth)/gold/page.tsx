"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ────────────────────────────────────────────────
// Types - متوافقة مع JSON من سيرفر البايثون
type HistoricalData = {
  date: string;
  open: number;
  close: number;
  volume: number;
};

type PriceData = {
  month: string;
  price: number;
};

type VolatilityData = {
  month: string;
  volatility: number;
};

type GoldHistoryResponse = {
  prediction: number;
  historical_prices: Array<{
    date: string;
    open: number;
    close: number;
    volume: number;
    high?: number;
    low?: number;
  }>;
  chart_data: Array<{
    month: string;
    price: number;
  }>;
  volatility: number;
  current_price: number;
};

// ────────────────────────────────────────────────
export default function GoldPage() {
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [volatilityData, setVolatilityData] = useState<VolatilityData[]>([]);

  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [dailyChangePercent, setDailyChangePercent] = useState<number | null>(
    null,
  );

  const [goldValue, setGoldValue] = useState<string>("");
  const [prediction, setPrediction] = useState<number | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictError, setPredictError] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGoldHistory = async () => {
    setIsLoadingHistory(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:8000/api/assets/gold/history");
      if (!response.ok) {
        throw new Error(`Failed to load data: ${response.status}`);
      }

      const data: GoldHistoryResponse = await response.json();

      const formattedHistoricalData: HistoricalData[] =
        data.historical_prices.map((item) => ({
          date: item.date,
          open: item.open,
          close: item.close,
          volume: item.volume,
        }));
      setHistoricalData(formattedHistoricalData);
      setPriceData(data.chart_data);

      const formattedVolatilityData: VolatilityData[] = data.chart_data.map(
        (item) => ({
          month: item.month,
          volatility: data.volatility,
        }),
      );
      setVolatilityData(formattedVolatilityData);
      setCurrentPrice(data.current_price);

      if (data.historical_prices.length >= 2) {
        const lastClose =
          data.historical_prices[data.historical_prices.length - 1].close;
        const prevClose =
          data.historical_prices[data.historical_prices.length - 2].close;
        const changePercent = ((lastClose - prevClose) / prevClose) * 100;
        setDailyChangePercent(changePercent);
      }
    } catch (err: any) {
      console.error("Fetch Error:", err);
      setError(err.message || "Error fetching data from ML server");
    } finally {
      setIsLoadingHistory(false);
      setLoading(false);
    }
  };

  // تحميل البيانات الأولية عند فتح الصفحة
  useEffect(() => {
    fetchGoldHistory();
  }, []);

  // دالة إرسال السعر للحصول على التوقع الجديد من السيرفر
  const handleAIPredict = async () => {
    if (!goldValue || isNaN(Number(goldValue))) {
      setPredictError("Please enter a valid price");
      return;
    }

    setIsPredicting(true);
    setPredictError(null);
    setPrediction(null);

    try {
      const response = await fetch(
        "http://localhost:8000/api/assets/gold/predict",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value: parseFloat(goldValue) }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Prediction failed");
      }

      if (data.status === "success") {
        setPrediction(data.data.prediction);
        await fetchGoldHistory();
      } else {
        throw new Error(data.message || "Unexpected error occurred");
      }
    } catch (err: any) {
      console.error("Prediction error:", err);
      setPredictError(err.message || "Cannot get prediction. Check servers.");
    } finally {
      setIsPredicting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F59E0B]"></div>
        <div className="text-[#F3F4F6] text-lg">
          Loading gold data from ML server...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <div className="text-red-400 text-lg mb-4">{error}</div>
        <button
          onClick={fetchGoldHistory}
          className="px-4 py-2 bg-[#F59E0B] text-white rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-[#F3F4F6] mb-2">
          Gold Investment Analysis
        </h1>
        <p className="text-[#6B7280]">Track and analyze gold market trends</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1a1a1a] border border-[#1F2937] rounded-lg p-6">
          <p className="text-[#6B7280] text-sm font-medium mb-2">
            Current Price
          </p>
          <p className="text-4xl font-bold text-[#F3F4F6]">
            {currentPrice !== null
              ? `$${currentPrice.toFixed(2)}`
              : "Loading..."}
          </p>
          <p className="text-[#6B7280] text-sm mt-2">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="bg-[#1a1a1a] border border-[#1F2937] rounded-lg p-6">
          <p className="text-[#6B7280] text-sm font-medium mb-2">
            Daily Change %
          </p>
          <p
            className={`text-4xl font-bold ${dailyChangePercent !== null ? (dailyChangePercent >= 0 ? "text-[#10B981]" : "text-red-400") : "text-[#F3F4F6]"}`}
          >
            {dailyChangePercent !== null
              ? `${dailyChangePercent >= 0 ? "+" : ""}${dailyChangePercent.toFixed(2)}%`
              : "Loading..."}
          </p>
        </div>

        <div className="bg-[#1a1a1a] border border-[#1F2937] rounded-lg p-6">
          <p className="text-[#6B7280] text-sm font-medium mb-2">
            Prediction Status
          </p>
          <p className="text-2xl font-bold text-[#F3F4F6]">
            {prediction !== null ? `$${prediction.toFixed(2)}` : "Waiting..."}
          </p>
          <p className="text-[#6B7280] text-sm mt-2">AI Model Prediction</p>
        </div>
      </div>

      {/* AI Prediction Section */}
      <div className="bg-[#1a1a1a] border border-[#1F2937] rounded-lg p-6">
        <h2 className="text-2xl font-bold text-[#F3F4F6] mb-4">
          AI Gold Price Prediction
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-[#6B7280] text-sm font-medium mb-2">
              Enter Current Gold Price
            </label>
            <input
              type="number"
              value={goldValue}
              onChange={(e) => setGoldValue(e.target.value)}
              placeholder="Example: 1950.50"
              className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#1F2937] rounded-lg text-[#F3F4F6] outline-none focus:border-[#F59E0B]"
              step="any"
            />
          </div>
          <button
            onClick={handleAIPredict}
            disabled={isPredicting || isLoadingHistory}
            className={`w-full px-6 py-3 text-white font-bold rounded-lg transition-all ${isPredicting || isLoadingHistory ? "bg-[#6B7280]" : "bg-[#F59E0B] hover:bg-[#D97706]"}`}
          >
            {isPredicting
              ? "Training Model..."
              : isLoadingHistory
                ? "Updating..."
                : "Predict"}
          </button>
          {predictError && (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-3 text-red-400 text-sm">
              {predictError}
            </div>
          )}
          {prediction !== null && (
            <div className="bg-gradient-to-r from-[#F59E0B]/10 to-[#D97706]/10 border border-[#F59E0B] rounded-lg p-6 text-center">
              <p className="text-[#6B7280] text-sm font-medium mb-2">
                Predicted Price
              </p>
              <p className="text-5xl font-bold text-[#F59E0B] mb-2">
                ${prediction.toFixed(2)}
              </p>
              <p className="text-[#6B7280] text-xs">
                Based on input: ${parseFloat(goldValue).toFixed(2)}
              </p>
            </div>
          )}
        </div>
      </div>
      {/* Historical Data Table - Monthly Only */}
      <div className="bg-[#1a1a1a] border border-[#1F2937] rounded-lg p-6">
        <h2 className="text-2xl font-bold text-[#F3F4F6] mb-4">
          Historical Data (Monthly)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1F2937] text-[#6B7280]">
                <th className="px-4 py-3 font-medium">Month</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {priceData.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-[#1F2937] hover:bg-[#0a0a0a] text-[#F3F4F6]"
                >
                  <td className="px-4 py-3">{row.month}</td>
                  <td className="px-4 py-3 font-bold text-[#10B981]">
                    ${row.price.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-[#6B7280]">Monthly Record</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#1a1a1a] border border-[#1F2937] rounded-lg p-6 h-[400px]">
          <h3 className="text-xl font-bold text-[#F3F4F6] mb-4">
            Historical Gold Prices
          </h3>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={priceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
              <XAxis dataKey="month" stroke="#6B7280" />
              <YAxis stroke="#6B7280" domain={["auto", "auto"]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #1F2937",
                }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#F59E0B"
                strokeWidth={2}
                dot={{ fill: "#F59E0B" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-[#1a1a1a] border border-[#1F2937] rounded-lg p-6 h-[400px]">
          <h3 className="text-xl font-bold text-[#F3F4F6] mb-4">
            Monthly Volatility
          </h3>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={volatilityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
              <XAxis dataKey="month" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #1F2937",
                }}
              />
              <Bar dataKey="volatility" fill="#F59E0B" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
