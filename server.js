const express = require("express");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const db = require("./db");
const signUp = require("./routes/Signup");
const signIn = require("./routes/Signin");
const newToken = require("./routes/newToken");
const logout = require("./routes/logout");
const authenticateJWT = require("./authenticateJWT");
const logoutAll = require("./routes/logoutAll");
const fileList = require("./routes/fileList");
const fileDelete = require("./routes/fileDelete");
const fileGet = require("./routes/fileGet");
const fileUpload = require("./routes/fileUpload");
const fileDownload = require("./routes/fileDownload");
const fileUpdate = require("./routes/fileUpdate.js");

const REFRESH_SECRET_KEY = crypto.randomBytes(32).toString("hex");
const UPLOAD_DIR = "./uploads";

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

const cleanExpiredTokens = async () => {
  try {
    const [tokens] = await db.query("SELECT * FROM tokens");
    tokens.forEach((token) => {
      jwt.verify(token.token, REFRESH_SECRET_KEY, async (err) => {
        if (err) {
          await db.query("DELETE FROM tokens WHERE id = ?", [token.id]);
        }
      });
    });
  } catch (err) {
    console.error("Error cleaning expired tokens:", err.message);
  }
};

// Запускаем очистку каждые 24 часа
setInterval(cleanExpiredTokens, 24 * 60 * 60 * 1000);

const app = express();
app.use(bodyParser.json());
app.use(cors());

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

app.post("/signup", signUp);

app.post("/signin", signIn);

app.post("/signin/new_token", newToken);

// Выход с текущего устройства
app.post("/logout", authenticateJWT, logout);

// Выход со всех устройств
app.post("/logoutAll", authenticateJWT, logoutAll);

app.get("/info", authenticateJWT, (req, res) => {
  res.json({ id: req.user.id });
});

app.post("/file/upload", authenticateJWT, upload.single("file"), fileUpload);

app.get("/file/list", authenticateJWT, fileList);

app.delete("/file/delete/:id", authenticateJWT, fileDelete);

app.get("/file/:id", authenticateJWT, fileGet);

app.get("/file/download/:id", authenticateJWT, fileDownload);

app.put("/file/update/:id", authenticateJWT, upload.single("file"), fileUpdate);

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
