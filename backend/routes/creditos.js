const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { cloudinary, upload } = require('../config/cloudinary');

// GET /api/creditos  (?todos=1 incluye inactivos, para el panel)
router.get('/', async (req, res) => {
  try {
    const where = req.query.todos === '1' ? '' : 'WHERE activo = 1';
    const [rows] = await db.query(`SELECT * FROM creditos ${where} ORDER BY orden ASC, id DESC`);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/creditos
router.post('/', async (req, res) => {
  try {
    const { titulo, descripcion, tipo, imagen_url, orden } = req.body;
    if (!titulo) return res.status(400).json({ error: 'El titulo es obligatorio' });
    const [r] = await db.query(
      'INSERT INTO creditos (titulo, descripcion, tipo, imagen_url, orden) VALUES (?,?,?,?,?)',
      [titulo, descripcion || null, tipo || 'Normal', imagen_url || null, orden || 0]
    );
    res.status(201).json({ id: r.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/creditos/:id
router.put('/:id', async (req, res) => {
  try {
    const { titulo, descripcion, tipo, imagen_url, orden, activo } = req.body;
    await db.query(
      'UPDATE creditos SET titulo=?, descripcion=?, tipo=?, imagen_url=?, orden=?, activo=? WHERE id=?',
      [titulo, descripcion || null, tipo || 'Normal', imagen_url || null, orden || 0, activo ?? 1, req.params.id]
    );
    res.json({ mensaje: 'Actualizado' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/creditos/:id
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM creditos WHERE id = ?', [req.params.id]);
    res.json({ mensaje: 'Eliminado' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/creditos/:id/imagen
router.post('/:id/imagen', upload.single('imagen'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibio archivo' });
    const resultado = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'cuencasa/creditos', transformation: [{ width: 1200, quality: 'auto:good' }] },
        (error, result) => error ? reject(error) : resolve(result)
      );
      stream.end(req.file.buffer);
    });
    await db.query('UPDATE creditos SET imagen_url = ? WHERE id = ?', [resultado.secure_url, req.params.id]);
    res.json({ url: resultado.secure_url });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
