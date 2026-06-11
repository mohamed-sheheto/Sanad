const Portfolio = require("../models/portfolioModel");
const Holding = require("../models/holdingModel");
const AssetPrice = require("../models/assetPriceModel");

function mapAssetLabel(assetType) {
  if (assetType === "real_estate") return "Real Estate";
  if (assetType === "stocks") return "Stocks";
  if (assetType === "gold") return "Gold";
  return assetType;
}

async function getLatestPricesByAssetTypes(assetTypes) {
  const results = {};

  await Promise.all(
    assetTypes.map(async (assetType) => {
      const latest = await AssetPrice.findOne({ asset_type: assetType })
        .sort({ recorded_at: -1 })
        .lean();
      if (latest) {
        results[assetType] = latest.price;
      }
    }),
  );

  return results;
}

exports.getPortfolioSnapshot = async (req, res, next) => {
  try {
    const assets = ["Real Estate", "Stocks", "Gold"];
    const topAsset = assets[Math.floor(Math.random() * assets.length)];
    const totalValue = Math.round(50000 + Math.random() * 450000);
    const topAssetValue = Math.round(totalValue * (0.2 + Math.random() * 0.5));
    const topAssetPercentage = Math.round((topAssetValue / totalValue) * 100);
    const totalValueChange = parseFloat((Math.random() * 40 - 10).toFixed(1));
    const roi = parseFloat((Math.random() * 30 - 5).toFixed(1));
    const riskLevels = ["Low", "Medium", "High"];
    const riskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)];

    res.status(200).json({
      success: true,
      data: {
        roi,
        riskLevel,
        topAsset,
        totalValue,
        totalValueChange,
        topAssetValue,
        topAssetPercentage,
      },
    });
  } catch (err) {
    next(err);
  }
};
