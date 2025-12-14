const mongoose = require("mongoose");
const validtor = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    trim: true,
    required: [true, "username is required"],
    minLength: [3, "username min length is 3 chars "],
    maxLength: [20, "username max length is 20 chars"],
  },

  email: {
    type: String,
    required: [true, "email is required"],
    unique: true,
    trim: true,
    validate: {
      validator: validtor.isEmail,
      message: "invalid email",
    },
  },

  password: {
    type: String,
    required: [true, "password is required"],
    minLength: [6, "password should atleast contain 6 chars"],
    select: false,
  },

  passwordConfirm: {
    type: String,
    required: [true, "passwordConfirm is required"],
    validate: {
      validator: function (fieldValue) {
        return fieldValue === this.password;
      },
      message: "passwords don't match",
    },
  },
});

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  else {
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined;
  }
});

userSchema.methods.checkPassword = async function (password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
};

module.exports = mongoose.model("User", userSchema);
