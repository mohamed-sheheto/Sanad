const express = require("express");
const assetPriceController = require("../controllers/assetPriceController");
const holdingsController = require("../controllers/holdingsController");
const authController = require("../controllers/authController");

const router = express.Router();

router.get("/gold/prices", assetPriceController.getGoldPrices);
router.get("/stocks/prices", assetPriceController.getStocksPrices);
router.get("/realestate/prices", assetPriceController.getRealEstatePrices);

router.get(
  "/gold/holdings",
  authController.protect,
  holdingsController.getGoldHoldings,
);

router.get(
  "/stocks/holdings",
  authController.protect,
  holdingsController.getStocksHoldings,
);

router.get(
  "/realestate/holdings",
  authController.protect,
  holdingsController.getRealEstateHoldings,
);

module.exports = router;
