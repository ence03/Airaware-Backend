import jwt from "jsonwebtoken";

export const isAdmin = (req, res, next) => {
  // Extract token from the "Authorization" header
  const token = req.headers.authorization?.split(" ")[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    // Verify and decode the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Log the decoded token for debugging purposes
    console.log("Decoded Token:", decoded); // Check if role is available in decoded token

    // Check if the role is 'admin'
    if (decoded.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Forbidden: Admin access required" });
    }

    // Attach the decoded user information to the request object
    req.user = decoded;
    next();
  } catch (err) {
    // Handle errors in token verification
    if (err.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Unauthorized: Token has expired" });
    }
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};
