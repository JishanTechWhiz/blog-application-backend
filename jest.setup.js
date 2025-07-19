// jest.setup.js
require("dotenv").config();
const db = require("./models");

console.log("jest.setup.js loaded");

beforeAll(async () => {
  console.log("Resetting test DB...");
  await db.sequelize.sync({ force: true });
});

afterAll(async () => {
  console.log("Closing DB connection...");
  await db.sequelize.close();
});
