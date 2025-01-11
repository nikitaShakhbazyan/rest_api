const db = require('../db')
const path = require("path");


const fileUpdate = async (req, res) => {
    const fileId = req.params.id;
    const newFile = req.file;

    if (!newFile) return res.status(400).json({ message: "File not uploaded" });

    try {
      const [files] = await db.query("SELECT * FROM files WHERE id = ?", [
        fileId,
      ]);
      if (files.length === 0)
        return res.status(404).json({ message: "File not found" });

      const oldFile = files[0];
      const oldFilePath = path.join(UPLOAD_DIR, oldFile.name);
      if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);

      await db.query(
        "UPDATE files SET name = ?, extension = ?, mime_type = ?, size = ?, upload_date = NOW() WHERE id = ?",
        [
          newFile.filename,
          path.extname(newFile.originalname),
          newFile.mimetype,
          newFile.size,
          fileId,
        ]
      );

      res.json({ message: "File updated successfully" });
    } catch (err) {
      res
        .status(500)
        .json({ message: "Error updating file", error: err.message });
    }
  }
  
  module.exports = fileUpdate