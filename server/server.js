require("dotenv").config({ path: "./.env", quiet: true });
const mongoose = require("mongoose");
const app = require("./app");

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
