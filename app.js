//Make this app.js file for testing purpose...

const express = require("express");
const app_routing = require("./modules/app-routing");

const apps = express();
apps.use(express.json());

// Attach your v1 routes
app_routing.v1(apps);

module.exports = apps;
