const db = require('../db')
const path = require("path");

 const fileUpload = async (req, res) => {
    const file = req.file;
    if (!file) return res.status(400).json({ message: "File not uploaded" });

    try {
      await db.query(
        "INSERT INTO files (name, extension, mime_type, size, upload_date) VALUES (?, ?, ?, ?, NOW())",
        [
          file.filename,
          path.extname(file.originalname),
          file.mimetype,
          file.size,
        ]
      );
      res.status(201).json({ message: "File uploaded successfully" });
    } catch (err) {
      res
        .status(500)
        .json({ message: "Error saving file data", error: err.message });
    }
  }

  module.exports = fileUpload