const User = require("../models/user.model");
const AppError = require("../utils/appError");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt");

// Options for secure HTTP-only cookies
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "Lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days matching refresh token
};

/**
 * Helper to send tokens and user in response
 */
const sendTokenResponse = (user, statusCode, res) => {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Send refresh token as HTTP-Only Cookie
  res.cookie("refreshToken", refreshToken, cookieOptions);
  
  // Also send access token as cookie for client convenience if preferred
  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000, // 15 mins matching access token
  });

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    success: true,
    accessToken,
    user,
  });
};

/**
 * Register new user
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // 1. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError("User with this email already exists", 400));
    }

    // 2. Create local user
    const user = await User.create({
      name,
      email,
      password,
      authProvider: "local",
    });

    // 3. Send token response
    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Check if user exists and select password field
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return next(new AppError("Invalid email or password", 401));
    }

    // 2. If user registered via OAuth and hasn't set a local password
    if (user.authProvider !== "local" && !user.password) {
      return next(
        new AppError(
          `This account was created using ${user.authProvider} login. Please log in using that provider.`,
          400
        )
      );
    }

    // 3. Verify password
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return next(new AppError("Invalid email or password", 401));
    }

    // 4. Send token response
    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token
 */
const refreshToken = async (req, res, next) => {
  try {
    // 1. Get refresh token from cookies
    const token = req.cookies.refreshToken;
    if (!token) {
      return next(new AppError("Refresh token missing. Please log in again.", 401));
    }

    // 2. Verify token
    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch (err) {
      return next(new AppError("Invalid or expired refresh token. Please log in again.", 401));
    }

    // 3. Find user
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new AppError("The user belonging to this token no longer exists.", 401));
    }

    // 4. Generate new access token
    const accessToken = generateAccessToken(user._id);

    // Set new access token in cookie
    res.cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user
 */
const logout = async (req, res, next) => {
  try {
    // Clear cookies
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
    });
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
    });

    res.status(200).json({
      success: true,
      message: "Successfully logged out",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current logged in user details
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller after successful Passport authentication redirect
 */
const oauthSuccess = (req, res) => {
  const user = req.user;
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Set refresh token and access token in secure HTTP-only cookies
  res.cookie("refreshToken", refreshToken, cookieOptions);
  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000,
  });

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

  // Redirect to frontend (e.g. dashboard page or callback landing page)
  res.redirect(`${frontendUrl}/oauth-success?token=${accessToken}`);
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  oauthSuccess,
};
