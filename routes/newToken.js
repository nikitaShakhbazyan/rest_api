const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const SECRET_KEY = crypto.randomBytes(32).toString("hex");
const TOKEN_EXPIRATION = "10m";
const REFRESH_SECRET_KEY = crypto.randomBytes(32).toString("hex");
const db = require("../db");

const newToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(400).json({ message: "Refresh token required" });

  try {
    const [tokens] = await db.query("SELECT * FROM tokens WHERE token = ?", [
      refreshToken,
    ]);
    if (tokens.length === 0)
      return res.status(403).json({ message: "Invalid refresh token" });

    jwt.verify(refreshToken, REFRESH_SECRET_KEY, async (err, user) => {
      if (err)
        return res.status(403).json({ message: "Invalid refresh token" });

      const accessToken = jwt.sign({ id: user.id }, SECRET_KEY, {
        expiresIn: TOKEN_EXPIRATION,
      });
      res.json({ accessToken });
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error refreshing token", error: err.message });
  }
};

module.exports = newToken;
