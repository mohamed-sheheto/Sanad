const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const passport = require("passport");

const userRouter = require("./routes/userRoutes");
const trendRouter = require("./routes/trendRoutes");
const assetPriceRouter = require("./routes/assetPriceRoutes");
const portfolioRouter = require("./routes/portfolioRoutes");
const googleController = require("./controllers/googleStrategyController");

const app = express();

if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:3000";

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  }),
);

app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

app.use("/api/auth", userRouter);
app.use("/api", trendRouter);
app.use("/api/assets", assetPriceRouter);
app.use("/api/portfolio", portfolioRouter);

app.get("/", (req, res) => {
  res.send("Home page after Google login");
});

app.get("/api/auth/google", passport.authenticate("google"));
app.get(
  "/api/auth/google/redirect",
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: false,
  }),
  googleController.googleCallback,
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
