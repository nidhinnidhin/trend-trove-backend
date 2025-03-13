const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const Jwt = require("jsonwebtoken");
const User = require("../models/userModel");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "https://trendrove.shop/api/users/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if the user already exists
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          // If the user doesn't exist, create a new one
          user = new User({
            googleId: profile.id,
            email: profile.emails[0].value,
            firstname: profile.name.givenName,
            lastname: profile.name.familyName,
            image: profile.photos[0].value,
            // Optionally, set default values for username and password
            username: profile.emails[0].value.split('@')[0], // Example: Using email's local part as username
            password: null, // No password needed for Google login
          });

          await user.save();
        }

        // Generate a JWT token
        const token = Jwt.sign(
          { id: user._id, email: user.email },
          process.env.JWT_SECRET,
          { expiresIn: "1h" }
        );

        return done(null, { user, token });
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

module.exports = passport;
