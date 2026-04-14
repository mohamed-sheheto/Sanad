const passport = require("passport");
const googleAuth = require("passport-google-oauth20").Strategy;
const { createSendToken } = require("./authController");
const googleModel = require("../models/googleAuthModel");
const jwt = require("jsonwebtoken"); // مهم جداً لضمان عدم وجود Error صامت

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
        // البحث عن المستخدم
        let user = await googleModel.findOne({ googleId: profile.id });

        if (!user) {
          // إنشاء مستخدم جديد لو مش موجود
          user = await googleModel.create({
            username: profile.displayName,
            googleId: profile.id,
            // email: profile.emails && profile.emails[0].value (فكه لو الموديل فيه إيميل)
          });
        }

        return cb(null, user);
      } catch (err) {
        console.error("ERROR IN STRATEGY (Passport):", err);
        return cb(err, null);
      }
    }
  )
);

exports.googleCallback = function (req, res, next) {
  try {
    if (!req.user) {
      return res.redirect("http://localhost:3000/login?error=auth_failed");
    }

    // 1. تكوين التوكن (نفس الكود اللي فات)
    const jwt = require("jsonwebtoken");
    const token = jwt.sign(
      { id: req.user._id || req.user.id },
      process.env.TOKEN_SECRET,
      { expiresIn: process.env.TOKEN_EXPIRES_IN }
    );

    // 2. "الزتونة": بدل res.json، هنعمل redirect لصفحة في الفرونت إيند
    // هنبعت التوكن في الـ URL عشان الـ React يعرف يلقطه
    res.redirect(`http://localhost:3000/dashboard?token=${token}`);

  } catch (err) {
    console.error("ERROR IN CALLBACK:", err);
    res.redirect("http://localhost:3000/login?error=server_error");
  }
};