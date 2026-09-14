const express = require("express");
const passport = require("passport");
const router = express.Router();
const {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  oauthSuccess,
  forgotPassword,
  resetPassword,
} = require("../controllers/auth.controller");
const {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
} = require("../validators/auth.validator");
const { protect } = require("../middleware/auth.middleware");
const { authLimiter } = require("../middleware/rateLimit.middleware");

// Local Auth Routes (with rate limiter on sensitive endpoints)
router.post("/register", authLimiter, validateRegister, register);
router.post("/login", authLimiter, validateLogin, login);
router.post("/refresh", refreshToken);
router.post("/logout", logout);
router.post("/forgot-password", authLimiter, validateForgotPassword, forgotPassword);
router.patch("/reset-password/:token", authLimiter, validateResetPassword, resetPassword);

// Protected Profiles Route
router.get("/me", protect, getMe);

// Google OAuth Routes
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/api/v1/auth/login-failure", // Redirect or handle failure
  }),
  oauthSuccess
);

// GitHub OAuth Routes
router.get(
  "/github",
  passport.authenticate("github", {
    scope: ["user:email"],
    session: false,
  })
);

router.get(
  "/github/callback",
  passport.authenticate("github", {
    session: false,
    failureRedirect: "/api/v1/auth/login-failure",
  }),
  oauthSuccess
);

// Fallback failure route
router.get("/login-failure", (req, res) => {
  res.status(401).json({
    success: false,
    message: "OAuth login failed. Please try again.",
  });
});

module.exports = router;
