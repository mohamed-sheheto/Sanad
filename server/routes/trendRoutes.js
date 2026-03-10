const express = require("express");
const trendController = require("../controllers/trendController");

const router = express.Router();

router.get("/gold-trend", trendController.getGoldTrend);
router.get("/sp500-trend", trendController.getSp500Trend);
router.get("/real-estate-roi", trendController.getRealEstateRoi);

module.exports = router;
