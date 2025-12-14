const express = require("express");
const morgan = require("morgan");
const passport = require("passport");
const cookieParser = require("cookie-parser");

const userRouter = require("./routes/userRoutes");

const app = express();

if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

app.use("/api/v1/auth", userRouter);

app.use((req, res, next) => {
  const err = new Error(`cannot find ${req.originalUrl} on this server`);
  err.statusCode = 404;

  next(err);
});

module.exports = app;
