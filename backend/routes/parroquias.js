const express    = require('express');
const router     = express.Router();
const db         = require('../config/db');
const { cloudinary, upload } = require('../config/cloudinary');

// GET /api/parroquias
// ?inicio=1  → solo las que tienen mostrar_en_inicio = 1, ordenadas por orden ASC
router.get('/', async (req, res) => {
  try {
    let sql = 'SELECT * FROM parroquias WHERE activa = 1';
    if (req.query.inicio === '1') {
      sql += ' AND mostrar_en_inicio = 1 ORDER BY orden ASC';
    } else {
      sql += ' ORDER BY nombre ASC';
    }
    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/parroquias
router.post('/', async (req, res) => {
  try {
    const { nombre, mostrar_en_inicio = 0, orden = 0 } = req.body;
    if (!nombre) return res.status(400).json({ error: 'Nombre es obligatorio' });
    const [r] = await db.query(
      'INSERT INTO parroquias (nombre, mostrar_en_inicio, orden) VALUES (?, ?, ?)',
      [nombre.trim(), mostrar_en_inicio ? 1 : 0, Number(orden) || 0]
    );
    res.status(201).json({ id: r.insertId, mensaje: 'Parroquia creada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/parroquias/:id
router.put('/:id', async (req, res) => {
  try {
    const { nombre, mostrar_en_inicio, orden } = req.body;
    if (!nombre) return res.status(400).json({ error: 'Nombre es obligatorio' });
    const [r] = await db.query(
      'UPDATE parroquias SET nombre=?, mostrar_en_inicio=?, orden=? WHERE id=?',
      [nombre.trim(), mostrar_en_inicio ? 1 : 0, Number(orden) || 0, req.params.id]
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'Parroquia no encontrada' });
    res.json({ mensaje: 'Parroquia actualizada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/parroquias/:id  (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    await db.query('UPDATE parroquias SET activa = 0 WHERE id = ?', [req.params.id]);
    res.json({ mensaje: 'Parroquia eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/parroquias/:id/imagen
router.post('/:id/imagen', upload.single('imagen'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibio imagen' });
    const resultado = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'cuencasa/zonas', transformation: [{ width: 1600, quality: 'auto:good' }] },
        (error, result) => error ? reject(error) : resolve(result)
      );
      stream.end(req.file.buffer);
    });
    await db.query('UPDATE parroquias SET imagen_url=? WHERE id=?', [resultado.secure_url, req.params.id]);
    res.json({ url: resultado.secure_url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
