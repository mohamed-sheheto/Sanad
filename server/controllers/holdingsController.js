const Holding = require("../models/holdingModel");
const Portfolio = require("../models/portfolioModel");
const AssetPrice = require("../models/assetPriceModel");

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

async function getHoldingsByAsset(assetType, req, res, next) {
  try {
    const userId = req.user._id;

    const portfolio = await Portfolio.findOne({ user_id: userId }).lean();

    if (!portfolio) {
      return res.status(200).json({
        asset: assetType,
        holdings: [],
        totalValue: 0,
        totalInvested: 0,
      });
    }

    const latestPrices = await getLatestPricesByAssetTypes([assetType]);
    const latestPrice = latestPrices[assetType] || 0;

    const holdings = await Holding.find({
      asset_type: assetType,
      portfolio: portfolio._id,
    }).lean();

    if (!holdings.length) {
      return res.status(200).json({
        asset: assetType,
        holdings: [],
        totalValue: 0,
        totalInvested: 0,
      });
    }

    let totalValue = 0;
    let totalInvested = 0;

    const enrichedHoldings = holdings.map((holding) => {
      const amount = holding.amount || 0;
      const purchasePrice = holding.purchase_price || 0;
      const currentPrice = latestPrice;

      const currentValue = amount * currentPrice;
      const invested = amount * purchasePrice;
      const profitLoss = currentValue - invested;

      totalValue += currentValue;
      totalInvested += invested;

      return {
        id: holding._id,
        amount,
        purchasePrice,
        purchaseDate: holding.purchase_date,
        currentPrice,
        currentValue,
        profitLoss,
      };
    });

    res.status(200).json({
      asset: assetType,
      holdings: enrichedHoldings,
      totalValue,
      totalInvested,
    });
  } catch (err) {
    next(err);
  }
}

exports.getGoldHoldings = (req, res, next) =>
  getHoldingsByAsset("gold", req, res, next);

exports.getStocksHoldings = (req, res, next) =>
  getHoldingsByAsset("stocks", req, res, next);

exports.getRealEstateHoldings = (req, res, next) =>
  getHoldingsByAsset("real_estate", req, res, next);

