const mongoose = require("mongoose");

const googleAuthSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "username is required"],
  },

  googleId: {
    type: String,
    required: [true, "email is required"],
    unique: true,
  },
});

module.exports = mongoose.model("GoogleAuth", googleAuthSchema);
