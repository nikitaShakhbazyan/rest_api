
const crypto = require("crypto");
const db = require('./db')
const SECRET_KEY = crypto.randomBytes(32).toString("hex");

const authenticateJWT = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access denied' });
  
    try {
      const [rows] = await db.query('SELECT * FROM tokens WHERE token = ?', [token]);
      if (rows.length === 0) {
        return res.status(403).json({ message: 'Token is invalid or expired' });
      }
  
      jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user = user;
        next();
      });
    } catch (err) {
      res.status(500).json({ message: 'Error authenticating token', error: err.message });
    }
  };

  module.exports = authenticateJWT