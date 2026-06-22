const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM equipo WHERE activo = 1 ORDER BY orden ASC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { nombre, cargo, telefono, rol, descripcion, foto_url, instagram, orden } = req.body;
    const [r] = await db.query('INSERT INTO equipo (nombre, cargo, telefono, rol, descripcion, foto_url, instagram, orden) VALUES (?,?,?,?,?,?,?,?)', [nombre, cargo, telefono, rol, descripcion, foto_url, instagram, orden||0]);
    res.status(201).json({ id: r.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { nombre, cargo, telefono, rol, descripcion, foto_url, instagram, orden, activo } = req.body;
    await db.query('UPDATE equipo SET nombre=?, cargo=?, telefono=?, rol=?, descripcion=?, foto_url=?, instagram=?, orden=?, activo=? WHERE id=?', [nombre, cargo, telefono, rol, descripcion, foto_url, instagram, orden||0, activo??1, req.params.id]);
    res.json({ mensaje: 'Actualizado' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM equipo WHERE id = ?', [req.params.id]);
    res.json({ mensaje: 'Eliminado' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

const { cloudinary, upload } = require('../config/cloudinary');

// POST /api/equipo/:id/foto
router.post('/:id/foto', upload.single('foto'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibio archivo' });
    const resultado = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'cuencasa/equipo', transformation: [{ width: 400, height: 500, crop: 'fill', gravity: 'face' }] },
        (error, result) => error ? reject(error) : resolve(result)
      );
      stream.end(req.file.buffer);
    });
    await db.query('UPDATE equipo SET foto_url = ? WHERE id = ?', [resultado.secure_url, req.params.id]);
    res.json({ url: resultado.secure_url });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;