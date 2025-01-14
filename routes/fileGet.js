const db = require("../db");

const fileGet = async (req, res) => {
  const fileId = req.params.id;

  try {
    const [files] = await db.query("SELECT * FROM files WHERE id = ?", [
      fileId,
    ]);
    if (files.length === 0)
      return res.status(404).json({ message: "File not found" });

    res.json(files[0]);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching file info", error: err.message });
  }
};

module.exports = fileGet;
