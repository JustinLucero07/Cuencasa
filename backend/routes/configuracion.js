const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { cloudinary, upload } = require('../config/cloudinary');

// GET todas las configuraciones
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM configuracion');
    const config = {};
    rows.forEach(r => config[r.clave] = r.valor);
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/configuracion/upload-imagen — sube imagen a Cloudinary y guarda URL
router.post('/upload-imagen', upload.single('imagen'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibio archivo' });
    const resultado = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'cuencasa/config', transformation: [{ width: 1800, quality: 'auto:good' }] },
        (error, result) => error ? reject(error) : resolve(result)
      );
      stream.end(req.file.buffer);
    });
    await db.query(
      'INSERT INTO configuracion (clave, valor) VALUES (?, ?) ON DUPLICATE KEY UPDATE valor = ?',
      ['hero_imagen_url', resultado.secure_url, resultado.secure_url]
    );
    res.json({ url: resultado.secure_url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT actualizar una configuración por clave
router.put('/:clave', async (req, res) => {
  try {
    const { valor } = req.body;
    await db.query(
      'INSERT INTO configuracion (clave, valor) VALUES (?, ?) ON DUPLICATE KEY UPDATE valor = ?',
      [req.params.clave, valor, valor]
    );
    res.json({ mensaje: 'Configuración actualizada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
