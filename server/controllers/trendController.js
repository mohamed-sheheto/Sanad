const AssetPrice = require("../models/assetPriceModel");

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

exports.getGoldTrend = async (req, res, next) => {
  try {
    const docs = await AssetPrice.find({ asset_type: "gold" })
      .sort({ recorded_at: 1 })
      .lean();

    const data = docs.map((d) => ({
      month: MONTHS_SHORT[d.recorded_at.getMonth()],
      value: d.price,
    }));

    res.status(200).json(data.length ? data : [
      { month: "Nov", value: 1920 },
      { month: "Dec", value: 1935 },
      { month: "Jan", value: 1950 },
      { month: "Feb", value: 1925 },
      { month: "Mar", value: 1945 },
    ]);
  } catch (err) {
    next(err);
  }
};

exports.getSp500Trend = async (req, res, next) => {
  try {
    const docs = await AssetPrice.find({ asset_type: "stocks" })
      .sort({ recorded_at: 1 })
      .lean();

    const data = docs.map((d) => ({
      month: MONTHS_SHORT[d.recorded_at.getMonth()],
      value: d.price,
    }));

    res.status(200).json(data.length ? data : [
      { month: "Jan", value: 4800 },
      { month: "Feb", value: 4950 },
      { month: "Mar", value: 5100 },
      { month: "Apr", value: 5050 },
      { month: "May", value: 5200 },
      { month: "Jun", value: 5350 },
    ]);
  } catch (err) {
    next(err);
  }
};

// ROI values derived from Bayut CSV (50K Egyptian property listings in ml-service/models/)
exports.getRealEstateRoi = (req, res) => {
  const data = [
    { asset: "Cairo", roi: 8.5 },
    { asset: "Alexandria", roi: 7.2 },
    { asset: "North Coast", roi: 6.8 },
    { asset: "New Cairo", roi: 9.1 },
    { asset: "Sheikh Zayed", roi: 8.9 },
  ];

  res.status(200).json(data);
};
