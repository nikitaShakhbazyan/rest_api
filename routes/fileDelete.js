const db = require("../db");
const path = require("path");

const fileDelete = async (req, res) => {
  const fileId = req.params.id;

  try {
    const [files] = await db.query("SELECT * FROM files WHERE id = ?", [
      fileId,
    ]);
    if (files.length === 0)
      return res.status(404).json({ message: "File not found" });

    const file = files[0];
    const filePath = path.join(UPLOAD_DIR, file.name);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await db.query("DELETE FROM files WHERE id = ?", [fileId]);
    res.json({ message: "File deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting file", error: err.message });
  }
};

module.exports = fileDelete;
