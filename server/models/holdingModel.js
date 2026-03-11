const mongoose = require("mongoose");

const holdingSchema = new mongoose.Schema(
  {
    portfolio: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Portfolio",
      required: true,
      index: true,
    },
    asset_type: {
      type: String,
      enum: ["gold", "stocks", "real_estate"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    purchase_price: {
      type: Number,
      required: true,
      min: 0,
    },
    purchase_date: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const Holding = mongoose.model("Holding", holdingSchema);

module.exports = Holding;

