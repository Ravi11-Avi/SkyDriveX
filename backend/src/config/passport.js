const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const User = require("../models/user.model");

// Configure Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "placeholder-google-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "placeholder-google-client-secret",
      callbackURL: "/api/v1/auth/google/callback",
      proxy: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const googleId = profile.id;
        const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;
        const name = profile.displayName || profile.name.givenName || "Google User";
        const avatar = profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null;

        if (!email) {
          return done(new Error("Email not provided by Google account"), null);
        }

        // 1. Try to find user by googleId
        let user = await User.findOne({ googleId });
        if (user) {
          return done(null, user);
        }

        // 2. Try to find user by email
        user = await User.findOne({ email });
        if (user) {
          // Link Google account to existing user
          user.googleId = googleId;
          if (!user.avatar) user.avatar = avatar;
          // If the user was registered locally, keep authProvider as 'local' but store googleId for compatibility
          await user.save();
          return done(null, user);
        }

        // 3. Create a new user
        user = await User.create({
          name,
          email,
          googleId,
          authProvider: "google",
          avatar,
          isVerified: true, // Google emails are pre-verified
        });

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Configure GitHub OAuth Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID || "placeholder-github-client-id",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "placeholder-github-client-secret",
      callbackURL: "/api/v1/auth/github/callback",
      scope: ["user:email"], // Request email scope
      proxy: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const githubId = profile.id;
        const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : `${profile.username || profile.id}@github.com`;
        const name = profile.displayName || profile.username || "GitHub User";
        const avatar = profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null;

        // 1. Try to find user by githubId
        let user = await User.findOne({ githubId });
        if (user) {
          return done(null, user);
        }

        // 2. Try to find user by email
        user = await User.findOne({ email });
        if (user) {
          // Link GitHub account to existing user
          user.githubId = githubId;
          if (!user.avatar) user.avatar = avatar;
          await user.save();
          return done(null, user);
        }

        // 3. Create a new user
        user = await User.create({
          name,
          email,
          githubId,
          authProvider: "github",
          avatar,
          isVerified: true,
        });

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// We are not using session-based serialization because we are using JWT tokens
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
