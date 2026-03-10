const mongoose = require("mongoose");

const holdingsSchema = new mongoose.Schema({
  portfolio_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portfolio',
    required: [true, "portfolio_id is required"],
  },
  asset_type: {
    type: String,
    enum: ['gold', 'stocks', 'real_estate'],
    required: [true, "asset_type is required"],
  },
  amount: {
    type: Number,
    required: [true, "amount is required"],
    min: [0, "amount cannot be negative"],
  },
  purchase_price: {
    type: Number,
    required: [true, "purchase_price is required"],
    min: [0, "purchase_price cannot be negative"],
  },
  purchase_date: {
    type: Date,
    required: [true, "purchase_date is required"],
  },
}, {
  timestamps: true,
});

const Holdings = mongoose.model('Holdings', holdingsSchema);

module.exports = Holdings;