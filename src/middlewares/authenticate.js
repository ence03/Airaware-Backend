import jwt from "jsonwebtoken";

export const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; 
  console.log("Authorization header:", req.headers.authorization);
  console.log("Extracted token:", token);

  if (!token) {
    return res.status(401).json({ success: false, message: "Access denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token:", decoded);
    req.user = decoded;

    if (req.user.role === "admin") {
      next();
    } else {
      req.user.isAdmin = false;
      next();
    }
  } catch (error) {
    console.error("JWT verification error:", error.message);
    return res.status(403).json({ success: false, message: "Invalid token" });
  }
};
