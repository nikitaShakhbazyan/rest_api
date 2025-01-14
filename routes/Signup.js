const bcrypt = require("bcrypt");
const crypto = require("crypto");
const REFRESH_TOKEN_EXPIRATION = "1d";
const TOKEN_EXPIRATION = "10m";
const REFRESH_SECRET_KEY = crypto.randomBytes(32).toString("hex");
const SECRET_KEY = crypto.randomBytes(32).toString("hex");
const db = require("../db");
const jwt = require("jsonwebtoken");

const signUp = async (req, res) => {
  const { password, username } = req.body;
  if (!password || !username)
    return res.status(400).json({ message: "Invalid data" });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      "INSERT INTO users (password, username) VALUES (?, ?)",
      [hashedPassword, username]
    );
    const userId = result.insertId;

    const accessToken = jwt.sign({ id: userId }, SECRET_KEY, {
      expiresIn: TOKEN_EXPIRATION,
    });
    const refreshToken = jwt.sign({ id: userId }, REFRESH_SECRET_KEY, {
      expiresIn: REFRESH_TOKEN_EXPIRATION,
    });

    res.status(201).json({ accessToken, refreshToken });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error creating user", error: err.message });
  }
};

module.exports = signUp;
