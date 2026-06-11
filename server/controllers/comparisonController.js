const axios = require("axios");

const ML_URL = "http://localhost:8001";

async function proxyToML(path) {
  const { data } = await axios.get(`${ML_URL}${path}`);
  return data;
}

function getDuration(assetType) {
  if (assetType === "gold") return "1-3 months";
  if (assetType === "stocks") return "1-3 months";
  return "1-3 months";
}

function getConfidence(volatility) {
  if (volatility == null || volatility === 0) return { confidence: "Medium", score: 70 };
  if (volatility < 10) return { confidence: "Very High", score: 92 };
  if (volatility < 15) return { confidence: "High", score: 85 };
  if (volatility < 25) return { confidence: "Medium", score: 70 };
  return { confidence: "Low", score: 50 };
}

exports.getComparisonTable = async (req, res, next) => {
  try {
    const [goldData, stockData, reData] = await Promise.all([
      proxyToML("/gold/history"),
      proxyToML("/stocks/history/COMI.CA"),
      proxyToML("/real-estate/history?city=Cairo"),
    ]);

    const table = [
      {
        asset: "Gold",
        roi: goldData.volatility
          ? `${((goldData.prediction - goldData.current_price) / goldData.current_price * 100).toFixed(1)}%`
          : "8.5%",
        duration: getDuration("gold"),
        aiPrediction: goldData.prediction > (goldData.current_price || 0) ? "Positive ✓" : "Caution ⚠",
      },
      {
        asset: "Stocks",
        roi: stockData.current_price
          ? `${((stockData.prediction - stockData.current_price) / stockData.current_price * 100).toFixed(1)}%`
          : "12.5%",
        duration: getDuration("stocks"),
        aiPrediction: stockData.prediction > stockData.current_price ? "Positive ✓" : "Caution ⚠",
      },
      {
        asset: "Real Estate",
        roi: `${reData.marketStats?.averageROI || reData.prediction}%`,
        duration: getDuration("real_estate"),
        aiPrediction: (reData.marketStats?.averageROI || reData.prediction) > 0 ? "Strong ✓" : "Caution ⚠",
      },
    ];

    res.status(200).json({ success: true, data: table });
  } catch (err) {
    next(err);
  }
};

exports.getComparisonROI = async (req, res, next) => {
  try {
    const [goldData, stockData, reData] = await Promise.all([
      proxyToML("/gold/history"),
      proxyToML("/stocks/history/COMI.CA"),
      proxyToML("/real-estate/history?city=Cairo"),
    ]);

    const roi = [
      {
        asset: "Gold",
        roi: goldData.volatility
          ? parseFloat(((goldData.prediction - (goldData.current_price || 0)) / (goldData.current_price || 1) * 100).toFixed(1))
          : 8.5,
      },
      {
        asset: "Stocks",
        roi: stockData.current_price
          ? parseFloat(((stockData.prediction - stockData.current_price) / stockData.current_price * 100).toFixed(1))
          : 12.5,
      },
      {
        asset: "Real Estate",
        roi: reData.marketStats?.averageROI || reData.prediction || 8.2,
      },
    ];

    res.status(200).json({ success: true, data: roi });
  } catch (err) {
    next(err);
  }
};

exports.getComparisonProjection = async (req, res, next) => {
  try {
    const [goldData, stockData, reData] = await Promise.all([
      proxyToML("/gold/history"),
      proxyToML("/stocks/history/COMI.CA"),
      proxyToML("/real-estate/history?city=Cairo"),
    ]);

    const goldMap = new Map(
      (goldData.chart_data || []).map((d) => [d.month, d.price]),
    );
    const stockMap = new Map(
      (stockData.chart_data || []).map((d) => [d.month, d.price]),
    );
    const reMap = new Map(
      (reData.priceTrend || []).map((d) => [d.month, d.price]),
    );

    const allMonths = new Set([
      ...goldMap.keys(),
      ...stockMap.keys(),
      ...reMap.keys(),
    ]);

    const projection = Array.from(allMonths).sort().map((month) => ({
      month,
      gold: goldMap.get(month) || null,
      stocks: stockMap.get(month) || null,
      realEstate: reMap.get(month) || null,
    }));

    res.status(200).json({ success: true, data: projection });
  } catch (err) {
    next(err);
  }
};

exports.getComparisonConfidence = async (req, res, next) => {
  try {
    const [goldData, stockData, reData] = await Promise.all([
      proxyToML("/gold/history"),
      proxyToML("/stocks/history/COMI.CA"),
      proxyToML("/real-estate/history?city=Cairo"),
    ]);

    const goldChange = goldData.current_price
      ? ((goldData.prediction - goldData.current_price) / goldData.current_price * 100)
      : 10.8;
    const stockChange = stockData.current_price
      ? ((stockData.prediction - stockData.current_price) / stockData.current_price * 100)
      : 15.2;
    const reChange = reData.marketStats?.marketGrowth || 12.5;

    const goldConf = getConfidence(goldData.volatility);
    const stockConf = getConfidence(stockData.volatility);
    const reConf = getConfidence(undefined);

    const confidence = [
      { asset: "Gold", ...goldConf, change: `${goldChange >= 0 ? "+" : ""}${goldChange.toFixed(1)}%` },
      { asset: "Stocks", ...stockConf, change: `${stockChange >= 0 ? "+" : ""}${stockChange.toFixed(1)}%` },
      { asset: "Real Estate", ...reConf, change: `${reChange >= 0 ? "+" : ""}${reChange.toFixed(1)}%` },
    ];

    res.status(200).json({ success: true, data: confidence });
  } catch (err) {
    next(err);
  }
};
