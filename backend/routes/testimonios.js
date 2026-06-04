const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM testimonios WHERE activo = 1 ORDER BY orden ASC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { nombre, rol, texto, estrellas, orden } = req.body;
    const [r] = await db.query('INSERT INTO testimonios (nombre, rol, texto, estrellas, orden) VALUES (?,?,?,?,?)', [nombre, rol, texto, estrellas||5, orden||0]);
    res.status(201).json({ id: r.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { nombre, rol, texto, estrellas, activo, orden } = req.body;
    await db.query('UPDATE testimonios SET nombre=?, rol=?, texto=?, estrellas=?, activo=?, orden=? WHERE id=?', [nombre, rol, texto, estrellas||5, activo??1, orden||0, req.params.id]);
    res.json({ mensaje: 'Actualizado' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM testimonios WHERE id = ?', [req.params.id]);
    res.json({ mensaje: 'Eliminado' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;