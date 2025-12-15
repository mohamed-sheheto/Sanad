const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const passport = require("passport");

const userRouter = require("./routes/userRoutes");
const googleController = require("./controllers/googleStrategyController");

const app = express();

if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use("/api/v1/auth", userRouter);

app.get("/", (req, res) => {
  res.send("Home page after Google login");
});

app.get("/api/v1/auth/google", passport.authenticate("google"));
app.get(
  "/api/v1/auth/google/redirect",
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: false,
  }),
  googleController.googleCallback
);

app.use((req, res, next) => {
  const err = new Error(`cannot find ${req.originalUrl} on this server`);
  err.statusCode = 404;

  next(err);
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    status: "error",
    message: err.message || "Something went wrong",
  });
});

module.exports = app;
