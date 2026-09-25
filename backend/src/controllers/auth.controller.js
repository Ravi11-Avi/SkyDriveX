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

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  // Redirect to frontend (e.g. dashboard page or callback landing page)
  res.redirect(`${frontendUrl}/oauth-success?token=${accessToken}`);
};

const crypto = require("crypto");
const { sendPasswordResetEmail } = require("../services/email.service");
const File = require("../models/file.model");
const Folder = require("../models/folder.model");
const Share = require("../models/share.model");
const Activity = require("../models/activity.model");
const { deleteMultipleFiles } = require("../services/storage.service");
const { logActivity } = require("../services/activity.service");

/**
 * Update current user's profile (name, avatar)
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, avatar } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    if (name !== undefined) user.name = name.trim();
    if (avatar !== undefined) user.avatar = avatar ? avatar.trim() : null;

    await user.save();

    logActivity({
      user: userId,
      action: "PROFILE_UPDATE",
      itemType: "user",
      itemId: user._id,
      itemName: user.name,
      req,
    });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change current user password (Authenticated)
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId).select("+password");
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    if (user.authProvider !== "local" && !user.password) {
      return next(
        new AppError(
          `This account was registered using ${user.authProvider}. Password changes are only for local accounts.`,
          400
        )
      );
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return next(new AppError("Current password is incorrect", 401));
    }

    user.password = newPassword;
    await user.save();

    logActivity({
      user: userId,
      action: "PASSWORD_CHANGE",
      itemType: "user",
      itemId: user._id,
      itemName: user.name,
      req,
    });

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

/**
 * Permanently delete user account and all associated data (Files in S3, Folders, Shares, Logs)
 */
const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // 1. Find all files belonging to user
    const files = await File.find({ user: userId });
    const s3Keys = files.map((f) => f.s3Key).filter(Boolean);

    // 2. Delete all files from storage (S3 / local disk)
    if (s3Keys.length > 0) {
      await deleteMultipleFiles(s3Keys);
    }

    // 3. Delete database records
    await Promise.all([
      File.deleteMany({ user: userId }),
      Folder.deleteMany({ user: userId }),
      Share.deleteMany({ user: userId }),
      Activity.deleteMany({ user: userId }),
      User.findByIdAndDelete(userId),
    ]);

    // 4. Clear cookies
    res.clearCookie("refreshToken");
    res.clearCookie("accessToken");

    res.status(200).json({
      success: true,
      message: "Your account and all associated data have been permanently deleted.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request password reset link
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Don't leak whether a user exists
      return res.status(200).json({
        success: true,
        message: "If an account with that email exists, a password reset link has been sent.",
      });
    }

    // Generate reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Build reset URL
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    try {
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl,
      });

      res.status(200).json({
        success: true,
        message: "If an account with that email exists, a password reset link has been sent.",
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return next(new AppError("There was an error sending the reset email. Please try again later.", 500));
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password using valid token
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Hash raw token from URL to compare with hashed token in DB
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return next(new AppError("Token is invalid or has expired", 400));
    }

    // Set new password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Log the user in with new tokens
    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  updateProfile,
  changePassword,
  deleteAccount,
  oauthSuccess,
  forgotPassword,
  resetPassword,
};
