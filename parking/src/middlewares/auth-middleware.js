import jwt from "jsonwebtoken";

const verifyToken = (req, res, next) => {
  const { authorization } = req.headers;
    

  if (!authorization) {
    return res.status(401).json({ error: "Authorization header missing" });
  }

  let token = authorization.split(" ")[1];
  console.log(token);

  if (!token) {
    return res.status(401).json({ error: "Token missing" });
  }

  try {
    const verified = jwt.verify(token, process.env.SECRET_KEY);
    if (verified) {
      next();
    }
  } catch (error) {
    return res.status(401).json(error);
  }
};

export default verifyToken;
