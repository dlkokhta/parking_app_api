import jwt from "jsonwebtoken";
// Middleware function for JWT validation
const verifyToken = async (req, res, next) => {
  const { authorization } = req.headers;

  if (authorization) {
    const token = authorization.trim().split(" ")[1];
    jwt.verify(token, process.env.SECRET_KEY, {}, (error) => {
      if (error) {
        res.status(403).json("Unauthorized - Please log in");
      } else {
        next();
      }
    });
  } else {
    res.status(403).json("Verification error");
  }
};

export default verifyToken;
