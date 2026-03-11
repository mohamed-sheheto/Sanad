const express = require("express");
const assetPriceController = require("../controllers/assetPriceController");

const router = express.Router();

router.get("/gold/prices", assetPriceController.getGoldPrices);
router.get("/stocks/prices", assetPriceController.getStocksPrices);
router.get("/realestate/prices", assetPriceController.getRealEstatePrices);

module.exports = router;
