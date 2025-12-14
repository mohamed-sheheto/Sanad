const express = require("express");
const User = require("../models/userModel");
const GoogleAuth = require("../models/googleAuthModel");
const jwt = require("jsonwebtoken");

exports.signUp = async function (req, res, next) {
  try {
    const newuser = await User.create(req.body);
    newuser.password = undefined;

    const Token = await jwt.sign(
      { id: newuser._id },
      process.env.TOKEN_SECRET,
      {
        expiresIn: process.env.TOKEN_EXPIRES_IN,
      }
    );

    res.cookie("jwt", Token, {
      expires: new Date(
        Date.now() + process.env.COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    res.status(201).json({
      status: "success",
      Token,
      user: newuser,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
};
