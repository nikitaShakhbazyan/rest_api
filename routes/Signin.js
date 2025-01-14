const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");
const crypto = require("crypto");
const REFRESH_TOKEN_EXPIRATION = "1d";
const TOKEN_EXPIRATION = "10m";
const SECRET_KEY = crypto.randomBytes(32).toString("hex");
const REFRESH_SECRET_KEY = crypto.randomBytes(32).toString("hex");

const signIn = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: "Invalid data" });

  try {
    const [users] = await db.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);
    if (users.length === 0)
      return res.status(401).json({ message: "Invalid credentials" });

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      return res.status(401).json({ message: "Invalid credentials" });

    const accessToken = jwt.sign({ id: user.id }, SECRET_KEY, {
      expiresIn: TOKEN_EXPIRATION,
    });
    const refreshToken = jwt.sign({ id: user.id }, REFRESH_SECRET_KEY, {
      expiresIn: REFRESH_TOKEN_EXPIRATION,
    });

    // Сохраняем токен в БД
    await db.query("INSERT INTO tokens (user_id, token) VALUES (?, ?)", [
      user.id,
      refreshToken,
    ]);

    res.json({ accessToken, refreshToken });
  } catch (err) {
    res.status(500).json({ message: "Error logging in", error: err.message });
  }
};

module.exports = signIn;
