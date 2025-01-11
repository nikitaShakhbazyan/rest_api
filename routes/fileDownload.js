const db = require('../db')
const path = require("path");


const fileDownload = async (req, res) => {
    const fileId = req.params.id;
  
    try {
      const [files] = await db.query("SELECT * FROM files WHERE id = ?", [
        fileId,
      ]);
      if (files.length === 0)
        return res.status(404).json({ message: "File not found" });
  
      const file = files[0];
      const filePath = path.join(UPLOAD_DIR, file.name);
      if (!fs.existsSync(filePath))
        return res.status(404).json({ message: "File not found on server" });
  
      res.download(filePath);
    } catch (err) {
      res
        .status(500)
        .json({ message: "Error downloading file", error: err.message });
    }
  }

  module.exports = fileDownload