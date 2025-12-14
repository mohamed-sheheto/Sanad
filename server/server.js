const mongoose = require("mongoose");
const path = require("path");
const app = require("./app");
require("dotenv").config({ path: "./.env", quiet: true });

const database = process.env.DATABASE;
const port = process.env.PORT || 3000;

mongoose
  .connect(database)
  .then(() => {
    console.log("database connected ✅");
    app.listen(port, () => {
      console.log(`server is running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to database:", err.message || err);
    process.exit(1);
  });
