const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const multer = require('multer');
const mysql = require('mysql2/promise');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

const SECRET_KEY = crypto.randomBytes(32).toString('hex');
const REFRESH_SECRET_KEY = crypto.randomBytes(32).toString('hex');
const TOKEN_EXPIRATION = '10m';
const REFRESH_TOKEN_EXPIRATION = '1d';
const UPLOAD_DIR = './uploads';

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'rest_api',
});

db.getConnection()
  .then((connection) => {
    console.log('Database connected successfully');
    connection.release();
  })
  .catch((err) => {
    console.error('Database connection failed: ', err.message);
    process.exit(1);
  });

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

const app = express();
app.use(bodyParser.json());
app.use(cors())

const authenticateJWT = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access denied' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });


app.post('/signup', async (req, res) => {
    const { password, username } = req.body;
    if (!password || !username) return res.status(400).json({ message: 'Invalid data' });
  
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
  
      const [result] = await db.query('INSERT INTO users (password, username) VALUES (?, ?)', [hashedPassword, username]);
      const userId = result.insertId;
  
      const accessToken = jwt.sign({ id: userId }, SECRET_KEY, { expiresIn: TOKEN_EXPIRATION });
      const refreshToken = jwt.sign({ id: userId }, REFRESH_SECRET_KEY, { expiresIn: REFRESH_TOKEN_EXPIRATION });
  
      res.status(201).json({ accessToken, refreshToken });
    } catch (err) {
      res.status(500).json({ message: 'Error creating user', error: err.message });
    }
  });
  
  app.post('/signin', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Invalid data' });
  
    try {
      const [users] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
      if (users.length === 0) return res.status(401).json({ message: 'Invalid credentials' });
  
      const user = users[0];
  
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) return res.status(401).json({ message: 'Invalid credentials' });
  
      const accessToken = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: TOKEN_EXPIRATION });
      const refreshToken = jwt.sign({ id: user.id }, REFRESH_SECRET_KEY, { expiresIn: REFRESH_TOKEN_EXPIRATION });
  
      res.json({ accessToken, refreshToken });
    } catch (err) {
      res.status(500).json({ message: 'Error logging in', error: err.message });
    }
  });

  app.post('/signin/new_token', async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: 'Refresh token required' });
  
    jwt.verify(refreshToken, REFRESH_SECRET_KEY, (err, user) => {
      if (err) return res.status(403).json({ message: 'Invalid refresh token' });
  
      const accessToken = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: TOKEN_EXPIRATION });
  
      // refreshToken в cookies
      res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true, sameSite: 'Strict' });
  
      res.json({ accessToken });
    });
  });
  

app.get('/logout', authenticateJWT, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

app.get('/info', authenticateJWT, (req, res) => {
  res.json({ id: req.user.id });
});

app.post('/file/upload', authenticateJWT, upload.single('file'), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ message: 'File not uploaded' });

  try {
    await db.query('INSERT INTO files (name, extension, mime_type, size, upload_date) VALUES (?, ?, ?, ?, NOW())', [
      file.filename,
      path.extname(file.originalname),
      file.mimetype,
      file.size,
    ]);
    res.status(201).json({ message: 'File uploaded successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error saving file data', error: err.message });
  }
});

app.get('/file/list', authenticateJWT, async (req, res) => {
  const list_size = parseInt(req.query.list_size) || 10;
  const page = parseInt(req.query.page) || 1;
  const offset = (page - 1) * list_size;

  try {
    const [files] = await db.query('SELECT * FROM files LIMIT ? OFFSET ?', [list_size, offset]);
    res.json(files);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching file list', error: err.message });
  }
});

app.delete('/file/delete/:id', authenticateJWT, async (req, res) => {
  const fileId = req.params.id;

  try {
    const [files] = await db.query('SELECT * FROM files WHERE id = ?', [fileId]);
    if (files.length === 0) return res.status(404).json({ message: 'File not found' });

    const file = files[0];
    const filePath = path.join(UPLOAD_DIR, file.name);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await db.query('DELETE FROM files WHERE id = ?', [fileId]);
    res.json({ message: 'File deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting file', error: err.message });
  }
});

app.get('/file/:id', authenticateJWT, async (req, res) => {
  const fileId = req.params.id;

  try {
    const [files] = await db.query('SELECT * FROM files WHERE id = ?', [fileId]);
    if (files.length === 0) return res.status(404).json({ message: 'File not found' });

    res.json(files[0]);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching file info', error: err.message });
  }
});

app.get('/file/download/:id', authenticateJWT, async (req, res) => {
  const fileId = req.params.id;

  try {
    const [files] = await db.query('SELECT * FROM files WHERE id = ?', [fileId]);
    if (files.length === 0) return res.status(404).json({ message: 'File not found' });

    const file = files[0];
    const filePath = path.join(UPLOAD_DIR, file.name);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'File not found on server' });

    res.download(filePath);
  } catch (err) {
    res.status(500).json({ message: 'Error downloading file', error: err.message });
  }
});

app.put('/file/update/:id', authenticateJWT, upload.single('file'), async (req, res) => {
  const fileId = req.params.id;
  const newFile = req.file;

  if (!newFile) return res.status(400).json({ message: 'File not uploaded' });

  try {
    const [files] = await db.query('SELECT * FROM files WHERE id = ?', [fileId]);
    if (files.length === 0) return res.status(404).json({ message: 'File not found' });

    const oldFile = files[0];
    const oldFilePath = path.join(UPLOAD_DIR, oldFile.name);
    if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);

    await db.query(
      'UPDATE files SET name = ?, extension = ?, mime_type = ?, size = ?, upload_date = NOW() WHERE id = ?',
      [newFile.filename, path.extname(newFile.originalname), newFile.mimetype, newFile.size, fileId]
    );

    res.json({ message: 'File updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating file', error: err.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
