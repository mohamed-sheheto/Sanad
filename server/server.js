require("dotenv").config({ path: "./.env" });
const mongoose = require("mongoose");
const app = require("./app");

const databaseRaw = process.env.DATABASE;
const databasePassword = process.env.DATABASE_PASSWORD;
const port = process.env.PORT || 8000;

let database = databaseRaw;
if (databaseRaw && databaseRaw.includes('<PASSWORD>')) {
  database = databaseRaw.replace('<PASSWORD>', databasePassword);
}

if (!database) {
  process.exit(1);
}

mongoose
  .connect(database)
  .then(() => {
    console.log("Database connected successfully ✅");
    app.listen(port, () => {
      console.log(`Server is running on port ${port} 🚀`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to database:", err.message);
    process.exit(1);
  });