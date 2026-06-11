const express = require("express");
const comparisonController = require("../controllers/comparisonController");

const router = express.Router();

router.get("/table", comparisonController.getComparisonTable);
router.get("/roi", comparisonController.getComparisonROI);
router.get("/projection", comparisonController.getComparisonProjection);
router.get("/confidence", comparisonController.getComparisonConfidence);

module.exports = router;
