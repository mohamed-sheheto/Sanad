require("dotenv").config({ path: "./.env", quiet: true });
const mongoose = require("mongoose");
const path = require("path");
const app = require("./app");

const database = process.env.DATABASE;
const port = 3000 || process.env.PORT;

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
