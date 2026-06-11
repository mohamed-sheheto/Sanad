const express = require("express");
const axios = require("axios");
const assetPriceController = require("../controllers/assetPriceController");
const holdingsController = require("../controllers/holdingsController");
const authController = require("../controllers/authController");
const router = express.Router();

const ML_URL = "http://localhost:8001";

// ── DB-backed price & holdings routes (existing) ──
router.get("/gold/prices", assetPriceController.getGoldPrices);
router.get("/stocks/prices", assetPriceController.getStocksPrices);
router.get("/realestate/prices", assetPriceController.getRealEstatePrices);
router.get("/gold/holdings", authController.protect, holdingsController.getGoldHoldings);
router.get("/stocks/holdings", authController.protect, holdingsController.getStocksHoldings);
router.get("/realestate/holdings", authController.protect, holdingsController.getRealEstateHoldings);

// ── ML proxy helper ──
async function proxyML(req, res, mlPath, transform) {
  try {
    const queryStr = Object.keys(req.query).length
      ? "?" + new URLSearchParams(req.query).toString()
      : "";
    const { data } = await axios.get(`${ML_URL}${mlPath}${queryStr}`);
    res.status(200).json(transform ? transform(data) : data);
  } catch (err) {
    if (err.code === "ECONNREFUSED") {
      return res.status(503).json({
        status: "error",
        message: "ML service unavailable on port 8001",
      });
    }
    res.status(500).json({
      status: "error",
      message: err.response?.data?.detail || err.message,
    });
  }
}

// ── Gold ML proxies ──
router.get("/gold/history", (req, res) => proxyML(req, res, "/gold/history"));

router.post("/gold/predict", async (req, res) => {
  try {
    const { value } = req.body;
    if (!value && value !== 0) {
      return res.status(400).json({
        status: "error",
        message: "value is required",
      });
    }
    const { data } = await axios.post(`${ML_URL}/predict/gold`, { value });
    res.status(200).json({ status: "success", data });
  } catch (err) {
    if (err.code === "ECONNREFUSED") {
      return res.status(503).json({ status: "error", message: "ML service unavailable" });
    }
    res.status(500).json({ status: "error", message: err.response?.data?.detail || err.message });
  }
});

// ── Stocks ML proxies ──
router.get("/stocks/list", (req, res) => proxyML(req, res, "/stocks"));

router.get("/stocks/history/:ticker", (req, res) =>
  proxyML(req, res, `/stocks/history/${req.params.ticker}`),
);

router.post("/stocks/predict", async (req, res) => {
  try {
    const { value, stock } = req.body;
    if (!value && value !== 0) {
      return res.status(400).json({ status: "error", message: "value is required" });
    }
    const { data } = await axios.post(`${ML_URL}/predict/stock`, {
      value,
      stock: stock || "COMI.CA",
    });
    res.status(200).json({ status: "success", data });
  } catch (err) {
    if (err.code === "ECONNREFUSED") {
      return res.status(503).json({ status: "error", message: "ML service unavailable" });
    }
    res.status(500).json({ status: "error", message: err.response?.data?.detail || err.message });
  }
});

// ── Real Estate ML proxies ──
router.get("/realestate/history", (req, res) => proxyML(req, res, "/real-estate/history"));

router.get("/realestate/cities", (req, res) => proxyML(req, res, "/real-estate/cities"));

router.post("/realestate/predict", async (req, res) => {
  try {
    const { value, city, property_type } = req.body;
    if (!value && value !== 0) {
      return res.status(400).json({ status: "error", message: "value is required" });
    }
    const { data } = await axios.post(`${ML_URL}/predict/real_estate`, {
      value,
      city: city || "Cairo",
      property_type: property_type || "Apartment",
    });
    res.status(200).json({ status: "success", data });
  } catch (err) {
    if (err.code === "ECONNREFUSED") {
      return res.status(503).json({ status: "error", message: "ML service unavailable" });
    }
    res.status(500).json({ status: "error", message: err.response?.data?.detail || err.message });
  }
});

module.exports = router;