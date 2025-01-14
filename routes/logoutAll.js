const db = require("../db");

const logoutAll = async (req, res) => {
  try {
    await db.query("DELETE FROM tokens WHERE user_id = ?", [req.user.id]); // Удаляем все токены пользователя
    res.json({ message: "Logged out from all devices successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Error logging out from all devices",
      error: err.message,
    });
  }
};

module.exports = logoutAll;
