const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
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

module.exports = mongoose.model("User", userSchema);
