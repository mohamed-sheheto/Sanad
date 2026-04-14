const User = require("../models/userModel");
const googleModel = require("../models/googleAuthModel");
const jwt = require("jsonwebtoken");

const createSendToken = (user, statusCode, res) => {
  const token = jwt.sign(
    { id: user._id || user.id },
    process.env.TOKEN_SECRET,
    {
      expiresIn: process.env.TOKEN_EXPIRES_IN,
    },
  );

  res.cookie("jwt", token, {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });

  if (user.password) user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    user,
  });
};

exports.createSendToken = createSendToken;

exports.protect = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({
        status: "fail",
        message: "You are not logged in!",
      });
    }

    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);

    // البحث في الموديلين لضمان وجود اليوزر
    let currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      currentUser = await googleModel.findById(decoded.id);
    }

    if (!currentUser) {
      return res.status(401).json({
        status: "fail",
        message: "The user belonging to this token no longer exist.",
      });
    }

    req.user = currentUser;
    next();
  } catch (err) {
    return res.status(401).json({
      status: "fail",
      message: "Invalid token",
    });
  }
};

exports.signUp = async function (req, res, next) {
  try {
    const newuser = await User.create(req.body);
    createSendToken(newuser, 201, res);
  } catch (err) {
    next(err);
  }
};

exports.login = async function (req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).send("Provide email and password");

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.checkPassword(password, user.password))) {
      return res.status(401).send("Invalid email or password");
    }
    createSendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

exports.getMe = async function (req, res, next) {
  try {
    const user =
      (await User.findById(req.user._id)) ||
      (await googleModel.findById(req.user._id));
    res.status(200).json({ status: "success", data: { user } });
  } catch (err) {
    next(err);
  }
};

exports.updateMe = async function (req, res, next) {
  try {
    // Only allow updating certain fields
    const allowedFields = ["username", "email"];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field]) {
        updates[field] = req.body[field];
      }
    });

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: "success",
      data: {
        user: updatedUser,
      },
    });
  } catch (err) {
    console.log("updateMe error", err);
    next(err);
  }
};

exports.changePassword = async function (req, res, next) {
  try {
    const { currentPassword, newPassword, newPasswordConfirm } = req.body;

    if (!currentPassword || !newPassword || !newPasswordConfirm) {
      return res.status(400).json({
        status: "fail",
        message:
          "Please provide current password, new password, and confirmation",
      });
    }

    if (newPassword !== newPasswordConfirm) {
      return res.status(400).json({
        status: "fail",
        message: "New passwords do not match",
      });
    }

    const user = await User.findById(req.user._id).select("+password");

    if (!(await user.checkPassword(currentPassword, user.password))) {
      return res.status(401).json({
        status: "fail",
        message: "Current password is incorrect",
      });
    }

    user.password = newPassword;
    user.passwordConfirm = newPasswordConfirm;
    await user.save();

    createSendToken(user, 200, res);
  } catch (err) {
    console.log("changePassword error", err);
    next(err);
  }
};
