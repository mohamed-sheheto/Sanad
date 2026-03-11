const express = require("express");
const authController = require("../controllers/authController");
const portfolioController = require("../controllers/portfolioController");

const router = express.Router();

router.get(
  "/snapshot",
  authController.protect,
  portfolioController.getPortfolioSnapshot,
);

module.exports = router;

