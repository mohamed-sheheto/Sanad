const passport = require("passport");
const googleAuth = require("passport-google-oauth20").Strategy;
const { createSendToken } = require("./authController");
const googleModel = require("../models/googleAuthModel");

passport.use(
  new googleAuth(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ["profile"],
    },
    async function (accessToken, refreshToken, profile, cb) {
      try {
        const findUser = await googleModel.findOne({ googleId: profile.id });

        if (!findUser) {
          const newUser = await googleModel.create({
            username: profile.displayName,
            googleId: profile.id,
          });

          return cb(null, newUser);
        }

        return cb(null, findUser);
      } catch (err) {
        console.log("Google auth error", err);
        err.statusCode = err.statusCode || 500;
        return cb(err, null);
      }
    }
  )
);

exports.googleCallback = function (req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: "fail",
        message: "Google authentication failed",
      });
    }

    createSendToken(req.user, 200, res);
  } catch (err) {
    console.log("googleCallback error", err);
    next(err);
  }
};
