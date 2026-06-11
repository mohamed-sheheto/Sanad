const mongoose = require("mongoose");

const googleAuthSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "username is required"],
    },

    googleId: {
      type: String,
      required: [true, "email is required"],
      unique: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

googleAuthSchema.virtual("joinedAt").get(function () {
  return this.createdAt || this._id.getTimestamp();
});

module.exports = mongoose.model("GoogleAuth", googleAuthSchema);
