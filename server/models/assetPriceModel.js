const mongoose = require("mongoose");

const assetPriceSchema = new mongoose.Schema({
  asset_type: {
    type: String,
    enum: ['gold', 'stocks', 'real_estate'],
    required: [true, "asset_type is required"],
  },
  price: {
    type: Number,
    required: [true, "price is required"],
    min: [0, "price cannot be negative"],
  },
  recorded_at: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

const AssetPrice = mongoose.model('AssetPrice', assetPriceSchema);

module.exports = AssetPrice;