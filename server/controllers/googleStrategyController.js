const passport = require("passport");
const googleAuth = require("passport-google-oauth20").Strategy;
const { createSendToken } = require("./authController");
const googleModel = require("../models/googleAuthModel");
const jwt = require("jsonwebtoken");

passport.use(
  new googleAuth(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ["profile", "email"],
    },
    async function (accessToken, refreshToken, profile, cb) {
      try {
        let user = await googleModel.findOne({ googleId: profile.id });

        if (!user) {
          user = await googleModel.create({
            username: profile.displayName,
            googleId: profile.id,
          });
        }

        return cb(null, user);
      } catch (err) {
        console.error("ERROR IN STRATEGY (Passport):", err);
        return cb(err, null);
      }
    },
  ),
);

exports.googleCallback = function (req, res, next) {
  try {
    if (!req.user) {
      return res.redirect("http://localhost:3000/login?error=auth_failed");
    }

    const jwt = require("jsonwebtoken");
    const token = jwt.sign(
      { id: req.user._id || req.user.id },
      process.env.TOKEN_SECRET,
      { expiresIn: process.env.TOKEN_EXPIRES_IN },
    );

    res.redirect(`http://localhost:3000/dashboard?token=${token}`);
  } catch (err) {
    console.error("ERROR IN CALLBACK:", err);
    res.redirect("http://localhost:3000/login?error=server_error");
  }
};
