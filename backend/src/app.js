const express = require("express");

const app = express();

app.use(express.json());

// Routes
const healthRoutes = require("./routes/health.routes");
app.use("/api/v1", healthRoutes);

module.exports = app;