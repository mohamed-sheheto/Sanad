require("dotenv").config({ path: "./.env" });
const mongoose = require("mongoose");
const User = require("./models/userModel");
const Portfolio = require("./models/portfolioModel");
const Holding = require("./models/holdingModel");
const AssetPrice = require("./models/assetPriceModel");

const databaseRaw = process.env.DATABASE;
const databasePassword = process.env.DATABASE_PASSWORD;

let database = databaseRaw;
if (databaseRaw && databaseRaw.includes("<PASSWORD>")) {
  database = databaseRaw.replace("<PASSWORD>", databasePassword);
}

if (!database) {
  console.error("DATABASE not configured in .env");
  process.exit(1);
}

const MONTHS = [
  { label: "2024-01", date: new Date("2024-01-15") },
  { label: "2024-02", date: new Date("2024-02-15") },
  { label: "2024-03", date: new Date("2024-03-15") },
  { label: "2024-04", date: new Date("2024-04-15") },
  { label: "2024-05", date: new Date("2024-05-15") },
  { label: "2024-06", date: new Date("2024-06-15") },
];

const GOLD_PRICES = [1920, 1935, 1950, 1925, 1945, 1970];
const STOCK_PRICES = [4800, 4950, 5100, 5050, 5200, 5350];
const RE_PRICES = [4200, 4350, 4400, 4550, 4420, 4620];

async function seed() {
  try {
    await mongoose.connect(database);
    console.log("Connected to MongoDB");

    // Clear existing seed data
    await AssetPrice.deleteMany({});
    await Holding.deleteMany({});
    await Portfolio.deleteMany({});

    // 1. Create test user (or find existing)
    let user = await User.findOne({ email: "test@sanad.com" });
    if (!user) {
      user = await User.create({
        username: "Test User",
        email: "test@sanad.com",
        password: "test123456",
        passwordConfirm: "test123456",
      });
      console.log("Created test user: test@sanad.com / test123456");
    } else {
      console.log("Using existing test user:", user.email);
    }

    // 2. Create portfolio
    const portfolio = await Portfolio.create({
      user_id: user._id,
      total_invested: 100000,
      current_value: 125450,
    });
    console.log("Created portfolio");

    // 3. Create holdings
    const holdingsData = [
      { asset_type: "gold", amount: 10, purchase_price: 1900, purchase_date: new Date("2024-01-01") },
      { asset_type: "stocks", amount: 5, purchase_price: 4800, purchase_date: new Date("2024-01-01") },
      { asset_type: "real_estate", amount: 2, purchase_price: 4200, purchase_date: new Date("2024-01-01") },
    ];

    for (const h of holdingsData) {
      await Holding.create({ portfolio: portfolio._id, ...h });
    }
    console.log("Created holdings");

    // 4. Create AssetPrice historical records
    const assetPrices = [];
    for (let i = 0; i < MONTHS.length; i++) {
      assetPrices.push(
        { asset_type: "gold", price: GOLD_PRICES[i], recorded_at: MONTHS[i].date },
        { asset_type: "stocks", price: STOCK_PRICES[i], recorded_at: MONTHS[i].date },
        { asset_type: "real_estate", price: RE_PRICES[i], recorded_at: MONTHS[i].date },
      );
    }
    await AssetPrice.insertMany(assetPrices);
    console.log(`Created ${assetPrices.length} asset price records`);

    console.log("\n✅ Seed complete!");
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

seed();
