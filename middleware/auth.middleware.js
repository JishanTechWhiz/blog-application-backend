require("dotenv").config();
const jwt = require("../utilities/jwt");
const { custom_code } = require("../utilities/response_error_code");

/* -------------------- API KEY Middleware -------------------- */
exports.apiKeyMiddleware = (req, res, next) => {
  const clientKey = req.headers["x-api-key"];

  if (!clientKey || clientKey !== process.env.API_KEY) {
    return res.status(401).json({
      code: custom_code.UNAUTHORIZED,
      message: "Invalid API key",
    });
  }

  next();
};

/* -------------------- JWT Middleware -------------------- */
exports.jwtAuthMiddleware = (req, res, next) => {
  const token = req.headers["authorization"]; 

  //console.log('token',token);

  if (!token) {
    return res.status(401).json({
      code: custom_code.HEADER_TOKEN_MISSING,
      message: "Authorization token missing",
    });
  }

  try {
    const decoded = jwt.verifyToken(token);
    req.user = decoded; // attach decoded user info to request
    next();
  } catch (err) {
    return res.status(401).json({
      code: custom_code.HEADER_TOKEN_INVALID,
      message: "Invalid or expired token",
    });
  }
};
