const mongoose = require("mongoose");

const portfolioSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, "user_id is required"],
  },
  total_invested: {
    type: Number,
    required: [true, "total_invested is required"],
    min: [0, "total_invested cannot be negative"],
  },
  current_value: {
    type: Number,
    required: [true, "current_value is required"],
    min: [0, "current_value cannot be negative"],
  },
}, {
  timestamps: true, // adds createdAt and updatedAt
});

const Portfolio = mongoose.model('Portfolio', portfolioSchema);

module.exports = Portfolio;