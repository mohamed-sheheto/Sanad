const User = require("../models/userModel");
const GoogleAuth = require("../models/googleAuthModel");
const jwt = require("jsonwebtoken");

const createSendToken = (user, statusCode, res) => {
  const token = jwt.sign({ id: user._id }, process.env.TOKEN_SECRET, {
    expiresIn: process.env.TOKEN_EXPIRES_IN,
  });

  res.cookie("jwt", token, {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });

  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    user,
  });
};

exports.signUp = async function (req, res, next) {
  try {
    const newuser = await User.create(req.body);

    createSendToken(newuser, 201, res);
  } catch (err) {
    console.log(err);
    next(err);
  }
};

exports.login = async function (req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      res.status(400).send("please provide email and password");

    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.checkPassword(password, user.password)))
      res.status(401).send("invalid email or password, please try again");

    createSendToken(user, 200, res);
  } catch (err) {
    console.log(err);
    next(err);
  }
};
