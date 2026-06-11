"use client";

import { useState, useEffect, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface StockData {
  prediction: number;
  historical_prices: Array<{
    date: string;
    open: number;
    close: number;
    volume: number;
  }>;
  chart_data: Array<{
    month: string;
    price: number;
  }>;
  current_price: number;
  ticker_name: string;
}

interface AvailableStock {
  ticker: string;
  name: string;
}

export default function StocksPage() {
  const [availableStocks, setAvailableStocks] = useState<AvailableStock[]>([]);
  const [selectedTicker, setSelectedTicker] = useState<string>("COMI.CA");
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [loadingStocks, setLoadingStocks] = useState<boolean>(true);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [manualPrice, setManualPrice] = useState<string>("");
  const [isChangingStock, setIsChangingStock] = useState<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const fetchAvailableStocks = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/assets/stocks/list");
        const data = await response.json();
        const stocksArray = Object.entries(data.stocks).map(
          ([ticker, name]) => ({
            ticker,
            name: name as string,
          }),
        );
        setAvailableStocks(stocksArray);
      } catch (error) {
        console.error("Failed to fetch stocks:", error);
        setAvailableStocks([
          { ticker: "COMI.CA", name: "CIB" },
          { ticker: "FWRY.CA", name: "Fawry" },
          { ticker: "TMGH.CA", name: "Talaat Moustafa Group" },
          { ticker: "SWDY.CA", name: "El Sewedy Electric" },
          { ticker: "ISPH.CA", name: "Ibnsina Pharma" },
          { ticker: "ETEL.CA", name: "Telecom Egypt" },
          { ticker: "EGAL.CA", name: "Egypt Aluminum" },
        ]);
      } finally {
        setLoadingStocks(false);
      }
    };

    fetchAvailableStocks();
  }, []);

  const fetchStockHistory = async (ticker: string, price?: string) => {
    if (!ticker) return;

    setLoadingHistory(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      let url = `http://localhost:8000/api/assets/stocks/history/${ticker}`;
      if (price && price !== "" && !isNaN(parseFloat(price))) {
        url += `?manual_price=${parseFloat(price)}`;
      }
      const response = await fetch(url, { signal: abortController.signal });
      const data = await response.json();
      if (!abortController.signal.aborted) {
        setStockData(data);
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("Failed to fetch stock history:", error);
      }
    } finally {
      if (!abortController.signal.aborted) {
        setLoadingHistory(false);
        setIsChangingStock(false);
      }
    }
  };

  useEffect(() => {
    if (selectedTicker) {
      setIsChangingStock(true);
      fetchStockHistory(selectedTicker, manualPrice);
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [selectedTicker]);

  // REMOVED: useEffect that auto-triggered fetchStockHistory on manualPrice change
  // The prediction for custom price now only happens when user clicks "Predict" button

  const handlePredictClick = () => {
    if (selectedTicker) {
      fetchStockHistory(selectedTicker, manualPrice);
    }
  };

  const getMarketStatus = (prediction: number, currentPrice: number) => {
    const percentChange = ((prediction - currentPrice) / currentPrice) * 100;
    if (percentChange > 5) return "Strongly Bullish";
    if (percentChange > 0) return "Positive";
    if (percentChange > -5) return "Stable";
    return "Bearish";
  };

  const getPredictionSourceText = () => {
    if (!stockData) return "";
    if (manualPrice && manualPrice !== "") {
      return `From $${parseFloat(manualPrice).toLocaleString()} input`;
    }
    const percentChange =
      ((stockData.prediction - stockData.current_price) /
        stockData.current_price) *
      100;
    return `${percentChange.toFixed(2)}% from current price`;
  };

  const handleStockChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTicker = e.target.value;
    setSelectedTicker(newTicker);
    setManualPrice("");
  };

  const isLoading = loadingHistory || isChangingStock;

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-[#1a1a1a] border border-[#1F2937] rounded-lg p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Egyptian Stock Exchange Analysis
              </h1>
              <p className="text-gray-400 mt-1">
                AI-powered stock market analysis
              </p>
            </div>
            <div className="w-full md:w-64">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Company
              </label>
              <select
                value={selectedTicker}
                onChange={handleStockChange}
                className="w-full bg-[#0a0a0a] border border-[#1F2937] text-white rounded-lg px-4 py-2 focus:outline-none focus:border-[#10B981] transition-colors"
                disabled={loadingStocks}
              >
                {loadingStocks ? (
                  <option>Loading...</option>
                ) : (
                  availableStocks.map((stock) => (
                    <option key={stock.ticker} value={stock.ticker}>
                      {stock.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-[#1F2937]">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Enter Price for Prediction
            </label>
            <div className="relative flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Enter custom price (e.g., 85.50)"
                  value={manualPrice}
                  onChange={(e) => setManualPrice(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#F59E0B] text-white rounded-lg pl-8 pr-4 py-2 focus:outline-none focus:border-[#F59E0B] focus:ring-1 focus:ring-[#10B981] transition-all duration-200"
                />
                {manualPrice && manualPrice !== "" && (
                  <button
                    onClick={() => setManualPrice("")}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
              <button
                onClick={handlePredictClick}
                disabled={isLoading}
                className="bg-[#F59E0B] hover:bg-[#D97706] disabled:bg-[#F59E0B]/50 disabled:cursor-not-allowed text-white font-medium py-2 px-6 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#F59E0B] focus:ring-offset-2 focus:ring-offset-[#1a1a1a]"
              >
                {isLoading ? "Loading..." : "Predict"}
              </button>
            </div>
            <p className="text-gray-500 text-xs mt-2">
              {manualPrice && manualPrice !== ""
                ? "AI prediction based on your custom price"
                : "Leave empty to use current market price for prediction"}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="bg-[#1a1a1a] border border-[#1F2937] rounded-lg p-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#10B981]"></div>
              <p className="text-gray-400">
                {isChangingStock
                  ? "Switching to selected company..."
                  : "Loading market data..."}
              </p>
            </div>
          </div>
        ) : stockData ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#1a1a1a] border border-[#1F2937] rounded-lg p-6 hover:border-[#10B981] transition-all duration-300">
                <p className="text-gray-400 text-sm font-medium mb-2">
                  Current Price
                </p>
                <p className="text-4xl font-bold text-white">
                  ${stockData.current_price.toLocaleString()}
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  {stockData.ticker_name}
                </p>
              </div>

              <div className="bg-[#1a1a1a] border border-[#10B981]/30 rounded-lg p-6 hover:border-[#10B981] transition-all duration-300">
                <p className="text-gray-400 text-sm font-medium mb-2">
                  AI Prediction{" "}
                  {manualPrice ? "(Custom Input)" : "(Next Month)"}
                </p>
                <p className="text-4xl font-bold text-[#10B981]">
                  ${stockData.prediction.toLocaleString()}
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  {getPredictionSourceText()}
                </p>
              </div>

              <div className="bg-[#1a1a1a] border border-[#1F2937] rounded-lg p-6 hover:border-[#10B981] transition-all duration-300">
                <p className="text-gray-400 text-sm font-medium mb-2">
                  Market Status
                </p>
                <p className="text-4xl font-bold text-white">
                  {getMarketStatus(
                    stockData.prediction,
                    manualPrice && manualPrice !== ""
                      ? parseFloat(manualPrice)
                      : stockData.current_price,
                  )}
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  Based on AI analysis
                </p>
              </div>
            </div>

            <div className="bg-[#1a1a1a] border border-[#1F2937] rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                Stock Performance Chart
              </h2>
              <p className="text-gray-400 text-sm mb-6">
                Last 6 months performance
              </p>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={stockData.chart_data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                  <XAxis dataKey="month" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" domain={["auto", "auto"]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #1F2937",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "white" }}
                    formatter={(value: number) => [
                      `$${value.toLocaleString()}`,
                      "Price",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#F59E0B"
                    strokeWidth={3}
                    dot={{ fill: "#F59E0B", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[#1a1a1a] border border-[#1F2937] rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                Historical Data
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#1F2937]">
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">
                        Month
                      </th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">
                        Open Price
                      </th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">
                        Close Price
                      </th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">
                        Trade Volume
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockData.historical_prices.map((item, index) => (
                      <tr
                        key={index}
                        className="border-b border-[#1F2937] hover:bg-[#0a0a0a] transition-colors"
                      >
                        <td className="py-3 px-4 text-white">{item.date}</td>
                        <td className="py-3 px-4 text-gray-300">
                          ${item.open.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-gray-300">
                          ${item.close.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-gray-300">
                          {item.volume.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-[#1a1a1a] border border-[#1F2937] rounded-lg p-12">
            <p className="text-center text-gray-400">No data available</p>
          </div>
        )}
      </div>
    </div>
  );
}
