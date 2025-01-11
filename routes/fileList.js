const db = require('../db')

 const fileList = async (req, res) => {
    const list_size = parseInt(req.query.list_size) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * list_size;
  
    try {
      const [files] = await db.query("SELECT * FROM files LIMIT ? OFFSET ?", [
        list_size,
        offset,
      ]);
      res.json(files);
    } catch (err) {
      res
        .status(500)
        .json({ message: "Error fetching file list", error: err.message });
    }
    }

    module.exports = fileList