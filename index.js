const express = require("express");
require("dotenv").config();

const db = require("./models");
const apps = require("./app");

const app_routing = require("./modules/app-routing");

const { swaggerUi, swaggerSpec } = require("./swagger");




const app = express();
app.use(express.json());

// DB Sync
db.sequelize
  .sync({ alter: false })
  .then(() => {
    console.log("Database connected and models synced.");
  })
  .catch((err) => {
    console.error("Database sync error:", err);
  });

// Access Routes File : V1
app_routing.v1(app);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
