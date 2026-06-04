const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

// GET todos los sectores (opcionalmente filtrar por parroquia)
router.get('/', async (req, res) => {
  try {
    const { parroquia_id } = req.query;
    let query  = 'SELECT s.*, p.nombre as parroquia FROM sectores s LEFT JOIN parroquias p ON p.id = s.parroquia_id WHERE s.activo = 1';
    const params = [];
    if (parroquia_id) { query += ' AND s.parroquia_id = ?'; params.push(parroquia_id); }
    query += ' ORDER BY s.nombre';
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST crear sector
router.post('/', async (req, res) => {
  try {
    const { nombre, parroquia_id } = req.body;
    if (!nombre) return res.status(400).json({ error: 'Nombre es obligatorio' });
    const [result] = await db.query(
      'INSERT INTO sectores (nombre, parroquia_id) VALUES (?, ?)',
      [nombre, parroquia_id || null]
    );
    res.status(201).json({ id: result.insertId, mensaje: 'Sector creado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT editar sector
router.put('/:id', async (req, res) => {
  try {
    const { nombre, parroquia_id } = req.body;
    await db.query(
      'UPDATE sectores SET nombre = ?, parroquia_id = ? WHERE id = ?',
      [nombre, parroquia_id || null, req.params.id]
    );
    res.json({ mensaje: 'Sector actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE sector
router.delete('/:id', async (req, res) => {
  try {
    await db.query('UPDATE sectores SET activo = 0 WHERE id = ?', [req.params.id]);
    res.json({ mensaje: 'Sector eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;