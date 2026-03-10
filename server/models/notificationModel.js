const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, "user_id is required"],
  },
  message: {
    type: String,
    required: [true, "message is required"],
    trim: true,
  },
  is_read: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true, // adds createdAt and updatedAt
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;