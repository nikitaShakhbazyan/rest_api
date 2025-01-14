const db = require("../db");

const logout = async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  try {
    if (!token) {
      return res.status(400).json({ message: "Token not provided" });
    }

    await db.query("DELETE FROM tokens WHERE token = ?", [token]); // Удаляем только текущий токен
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error logging out", error: err.message });
  }
};

module.exports = logout;
