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
        let email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;
        const name = profile.displayName || profile.name.givenName || "Google User";
        const avatar = profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null;

        if (!email) {
          return done(new Error("Email not provided by Google account"), null);
        }
        email = email.toLowerCase().trim();

        // 1. Try to find user by googleId
        let user = await User.findOne({ googleId });
        if (user) {
          if (!user.avatar && avatar) {
            user.avatar = avatar;
            await user.save();
          }
          return done(null, user);
        }

        // 2. Try to find user by email (Account Linking)
        user = await User.findOne({ email });
        if (user) {
          // Link Google account to existing user
          user.googleId = googleId;
          if (!user.avatar && avatar) user.avatar = avatar;
          user.isVerified = true;
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
        let email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;

        // If email was not in profile.emails, fetch directly from GitHub user emails API
        if (!email && accessToken) {
          try {
            const emailRes = await fetch("https://api.github.com/user/emails", {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "User-Agent": "SkyDriveX-App",
                Accept: "application/vnd.github.v3+json",
              },
            });
            if (emailRes.ok) {
              const emailsData = await emailRes.json();
              if (Array.isArray(emailsData)) {
                const primaryEmail = emailsData.find((e) => e.primary && e.verified) || emailsData.find((e) => e.verified) || emailsData[0];
                if (primaryEmail && primaryEmail.email) {
                  email = primaryEmail.email;
                }
              }
            }
          } catch (e) {
            console.warn("Could not retrieve GitHub verified email from API:", e.message);
          }
        }

        if (!email) {
          email = `${profile.username || profile.id}@users.noreply.github.com`;
        }
        email = email.toLowerCase().trim();

        const name = profile.displayName || profile.username || "GitHub User";
        const avatar = profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null;

        // 1. Try to find user by githubId
        let user = await User.findOne({ githubId });
        if (user) {
          if (!user.avatar && avatar) {
            user.avatar = avatar;
            await user.save();
          }
          return done(null, user);
        }

        // 2. Try to find user by email (Account Linking)
        user = await User.findOne({ email });
        if (user) {
          // Link GitHub account to existing user
          user.githubId = githubId;
          if (!user.avatar && avatar) user.avatar = avatar;
          user.isVerified = true;
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
