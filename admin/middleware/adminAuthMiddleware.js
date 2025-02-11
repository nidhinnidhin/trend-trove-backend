const Jwt = require("jsonwebtoken");

const adminAuthMiddleware = (req, res, next) => {
  const JWT_SECRET = process.env.JWT_SECRET || "1921u0030";

  try {
    const token = req.cookies.adminToken; // ✅ Read token from cookies

    if (!token) {
      return res.status(401).json({ message: "No admin token provided. Unauthorized." });
    }

    const decoded = Jwt.verify(token, JWT_SECRET);

    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: Admins only." });
    }

    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token. Unauthorized." });
  }
};

module.exports = adminAuthMiddleware;
