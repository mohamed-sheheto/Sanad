const AssetPrice = require("../models/assetPriceModel");

function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function getInterval(req) {
  const allowed = ["daily", "weekly", "monthly"];
  const interval = (req.query.interval || "daily").toString().toLowerCase();
  return allowed.includes(interval) ? interval : "daily";
}

function bucketKey(date, interval) {
  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();

  if (interval === "monthly") {
    return `${year}-${String(month).padStart(2, "0")}`;
  }

  if (interval === "weekly") {
    const tmp = new Date(Date.UTC(year, d.getUTCMonth(), day));
    const dayNum = tmp.getUTCDay() || 7;
    tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((tmp - yearStart) / 86400000 + 1) / 7);
    return `${tmp.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
  }

  return d.toISOString().slice(0, 10);
}

async function getPricesByAsset(assetType, req, res, next) {
  try {
    const from = parseDate(req.query.from);
    const to = parseDate(req.query.to);
    const interval = getInterval(req);

    const filter = { asset_type: assetType };
    if (from || to) {
      filter.recorded_at = {};
      if (from) filter.recorded_at.$gte = from;
      if (to) filter.recorded_at.$lte = to;
    }

    const docs = await AssetPrice.find(filter).sort({ recorded_at: 1 }).lean();

    // Group by interval and take the latest price in each bucket
    const buckets = new Map();
    for (const doc of docs) {
      const key = bucketKey(doc.recorded_at, interval);
      const existing = buckets.get(key);
      if (
        !existing ||
        new Date(doc.recorded_at) > new Date(existing.recorded_at)
      ) {
        buckets.set(key, doc);
      }
    }

    const prices = Array.from(buckets.entries())
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([key, doc]) => ({
        date: key,
        price: doc.price,
      }));

    res.status(200).json({
      asset: assetType,
      interval,
      prices,
    });
  } catch (err) {
    next(err);
  }
}

exports.getGoldPrices = (req, res, next) =>
  getPricesByAsset("gold", req, res, next);

exports.getStocksPrices = (req, res, next) =>
  getPricesByAsset("stocks", req, res, next);

exports.getRealEstatePrices = (req, res, next) =>
  getPricesByAsset("real_estate", req, res, next);
