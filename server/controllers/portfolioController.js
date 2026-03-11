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
    const userId = req.user._id;

    const portfolio = await Portfolio.findOne({ user: userId }).lean();

    if (!portfolio) {
      return res.status(200).json({
        success: true,
        data: {
          roi: 0,
          riskLevel: "Medium",
          topAsset: null,
        },
      });
    }

    const [holdings, latestPrices] = await Promise.all([
      Holding.find({ portfolio: portfolio._id }).lean(),
      getLatestPricesByAssetTypes(["gold", "stocks", "real_estate"]),
    ]);

    // ROI calculation
    const totalInvested = portfolio.total_invested || 0;
    const currentValue = portfolio.current_value || 0;
    const roi =
      totalInvested > 0
        ? ((currentValue - totalInvested) / totalInvested) * 100
        : 0;

    // Risk level and top asset
    let riskLevel = "Medium";
    let topAsset = null;

    if (holdings.length > 0) {
      const valueByAsset = {};
      let totalCurrentValue = 0;

      for (const holding of holdings) {
        const latestPrice = latestPrices[holding.asset_type];
        if (!latestPrice) continue;

        const value = holding.amount * latestPrice;
        valueByAsset[holding.asset_type] =
          (valueByAsset[holding.asset_type] || 0) + value;
        totalCurrentValue += value;
      }

      if (totalCurrentValue > 0) {
        const realEstateShare =
          (valueByAsset.real_estate || 0) / totalCurrentValue;
        const stocksShare = (valueByAsset.stocks || 0) / totalCurrentValue;

        if (realEstateShare > 0.6) {
          riskLevel = "Low";
        } else if (stocksShare > 0.6) {
          riskLevel = "High";
        } else {
          riskLevel = "Medium";
        }

        let maxAssetType = null;
        let maxValue = 0;
        for (const [assetType, value] of Object.entries(valueByAsset)) {
          if (value > maxValue) {
            maxValue = value;
            maxAssetType = assetType;
          }
        }

        if (maxAssetType) {
          topAsset = mapAssetLabel(maxAssetType);
        }
      }
    }

    res.status(200).json({
      success: true,
      data: {
        roi,
        riskLevel,
        topAsset,
      },
    });
  } catch (err) {
    next(err);
  }
};

