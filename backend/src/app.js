const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const passport = require("./config/passport");
const errorHandler = require("./middleware/error.middleware");
const AppError = require("./utils/appError");

const app = express();

// 1. Global Middleware Setup
app.use(helmet()); // Security headers

// Logging in development
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Compress responses
app.use(compression());

// Enable CORS with support for sending credentials (cookies)
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// 2. Initialize Passport
app.use(passport.initialize());

// 3. Register Routes
const healthRoutes = require("./routes/health.routes");
const authRoutes = require("./routes/auth.routes");

app.use("/api/v1", healthRoutes);
app.use("/api/v1/auth", authRoutes);

// 4. Handle undefined routes
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 5. Centralized Error Handler Middleware (MUST be last)
app.use(errorHandler);

module.exports = app;