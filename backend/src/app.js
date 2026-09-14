const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const passport = require("./config/passport");
const errorHandler = require("./middleware/error.middleware");
const AppError = require("./utils/appError");
const { apiLimiter } = require("./middleware/rateLimit.middleware");
const sanitizeMiddleware = require("./middleware/sanitize.middleware");

const app = express();

// 1. Global Middleware Setup
app.use(helmet()); // Security headers

// Rate limiting for all API routes
app.use("/api", apiLimiter);

// Logging in development
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Compress responses
app.use(compression());

// Enable CORS with support for sending credentials (cookies)
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// Sanitize inputs against NoSQL query injection
app.use(sanitizeMiddleware);

// 2. Initialize Passport
app.use(passport.initialize());

// 3. Register Routes
const healthRoutes = require("./routes/health.routes");
const authRoutes = require("./routes/auth.routes");
const folderRoutes = require("./routes/folder.routes");
const fileRoutes = require("./routes/file.routes");
const trashRoutes = require("./routes/trash.routes");
const storageRoutes = require("./routes/storage.routes");
const shareRoutes = require("./routes/share.routes");
const activityRoutes = require("./routes/activity.routes");

app.use("/api/v1", healthRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/folders", folderRoutes);
app.use("/api/v1/files", fileRoutes);
app.use("/api/v1/trash", trashRoutes);
app.use("/api/v1/storage", storageRoutes);
app.use("/api/v1/shares", shareRoutes);
app.use("/api/v1/activities", activityRoutes);

// 4. Handle undefined routes
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 5. Centralized Error Handler Middleware (MUST be last)
app.use(errorHandler);

module.exports = app;