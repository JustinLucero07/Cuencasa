const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { cloudinary, upload } = require('../config/cloudinary');

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM servicios WHERE activo = 1 ORDER BY orden ASC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { titulo, descripcion, detalle, icono, orden } = req.body;
    const [r] = await db.query('INSERT INTO servicios (titulo, descripcion, detalle, icono, orden) VALUES (?,?,?,?,?)', [titulo, descripcion, detalle, icono, orden||0]);
    res.status(201).json({ id: r.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { titulo, descripcion, detalle, icono, orden, activo } = req.body;
    await db.query('UPDATE servicios SET titulo=?, descripcion=?, detalle=?, icono=?, orden=?, activo=? WHERE id=?', [titulo, descripcion, detalle, icono, orden||0, activo??1, req.params.id]);
    res.json({ mensaje: 'Actualizado' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM servicios WHERE id = ?', [req.params.id]);
    res.json({ mensaje: 'Eliminado' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/imagen', upload.single('imagen'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibio imagen' });
    const resultado = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'cuencasa/servicios', transformation: [{ width: 800, quality: 'auto:good' }] },
        (error, result) => error ? reject(error) : resolve(result)
      );
      stream.end(req.file.buffer);
    });
    await db.query('UPDATE servicios SET imagen_url=? WHERE id=?', [resultado.secure_url, req.params.id]);
    res.json({ url: resultado.secure_url });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
