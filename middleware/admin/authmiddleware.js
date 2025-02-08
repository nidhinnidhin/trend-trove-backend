const Jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const JWT_SECRET = process.env.JWT_SECRET || "1921u0030";

  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided. Unauthorized." });
    }

    const decoded = Jwt.verify(token, JWT_SECRET);
    req.user = decoded; 
    next(); 
  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    res.status(500).json({ message: "An error occurred", error: err.message });
  }
};

module.exports = authMiddleware;