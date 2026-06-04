const express        = require('express');
const router         = express.Router();
const db             = require('../config/db');
const { cloudinary, upload } = require('../config/cloudinary');

// GET todos los proyectos
router.get('/', async (req, res) => {
  try {
    const { tipo, destacado } = req.query;
    let query  = `
      SELECT p.*,
        par.nombre AS parroquia,
        sec.nombre AS sector,
        (SELECT url FROM proyectos_fotos WHERE proyecto_id = p.id LIMIT 1) AS foto_principal
      FROM proyectos p
      LEFT JOIN parroquias par ON par.id = p.parroquia_id
      LEFT JOIN sectores   sec ON sec.id = p.sector_id
      WHERE 1=1`;
    const params = [];
    if (tipo)      { query += ' AND p.tipo = ?';      params.push(tipo); }
    if (destacado) { query += ' AND p.destacado = 1'; }
    query += ' ORDER BY p.creado_at DESC';
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET un proyecto por id
router.get('/:id', async (req, res) => {
  try {
    const [proyectos] = await db.query(`
      SELECT p.*, par.nombre AS parroquia, sec.nombre AS sector
      FROM proyectos p
      LEFT JOIN parroquias par ON par.id = p.parroquia_id
      LEFT JOIN sectores   sec ON sec.id = p.sector_id
      WHERE p.id = ?`, [req.params.id]);
    if (!proyectos.length) return res.status(404).json({ error: 'Proyecto no encontrado' });
    const [fotos]    = await db.query('SELECT * FROM proyectos_fotos WHERE proyecto_id = ?', [req.params.id]);
    const [unidades] = await db.query('SELECT * FROM proyecto_unidades WHERE proyecto_id = ? ORDER BY precio', [req.params.id]);
    res.json({ ...proyectos[0], fotos, unidades });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST crear proyecto
router.post('/', async (req, res) => {
  try {
    const { titulo, tipo, precio_desde, precio_hasta, descripcion, metros_terreno, metros_construccion, plantas, parqueadero, antiguedad, link_mapa, link_recorrido, link_video, destacado, parroquia_id, sector_id, estado, entrega } = req.body;
    if (!titulo) return res.status(400).json({ error: 'Título es obligatorio' });
    const [result] = await db.query(
      `INSERT INTO proyectos (titulo, tipo, precio_desde, precio_hasta, descripcion, metros_terreno, metros_construccion, plantas, parqueadero, antiguedad, link_mapa, link_recorrido, link_video, destacado, parroquia_id, sector_id, estado, entrega)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [titulo, tipo, precio_desde, precio_hasta, descripcion, metros_terreno, metros_construccion, plantas, parqueadero||0, antiguedad, link_mapa, link_recorrido, link_video||null, destacado||0, parroquia_id, sector_id, estado, entrega]
    );
    res.status(201).json({ id: result.insertId, mensaje: 'Proyecto creado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT editar proyecto
router.put('/:id', async (req, res) => {
  try {
    const { titulo, tipo, precio_desde, precio_hasta, descripcion, metros_terreno, metros_construccion, plantas, parqueadero, antiguedad, link_mapa, link_recorrido, link_video, destacado, parroquia_id, sector_id, estado, entrega } = req.body;
    await db.query(
      `UPDATE proyectos SET titulo=?, tipo=?, precio_desde=?, precio_hasta=?, descripcion=?, metros_terreno=?, metros_construccion=?, plantas=?, parqueadero=?, antiguedad=?, link_mapa=?, link_recorrido=?, link_video=?, destacado=?, parroquia_id=?, sector_id=?, estado=?, entrega=? WHERE id=?`,
      [titulo, tipo, precio_desde, precio_hasta, descripcion, metros_terreno, metros_construccion, plantas, parqueadero||0, antiguedad, link_mapa, link_recorrido, link_video||null, destacado||0, parroquia_id, sector_id, estado, entrega, req.params.id]
    );
    res.json({ mensaje: 'Proyecto actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE proyecto
router.delete('/:id', async (req, res) => {
  try {
    const [fotos] = await db.query('SELECT public_id FROM proyectos_fotos WHERE proyecto_id = ?', [req.params.id]);
    for (const f of fotos) await cloudinary.uploader.destroy(f.public_id);
    await db.query('DELETE FROM proyectos WHERE id = ?', [req.params.id]);
    res.json({ mensaje: 'Proyecto eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST subir fotos
router.post('/:id/fotos', upload.array('fotos', 30), async (req, res) => {
  try {
    if (!req.files || !req.files.length) return res.status(400).json({ error: 'No se enviaron fotos' });

    const uploadToCloudinary = (file) => new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'cuencasa/proyectos', timeout: 60000 },
        (err, result) => err ? reject(err) : resolve(result)
      );
      stream.end(file.buffer);
    });

    const BATCH = 5;
    const cloudinaryResults = [];
    for (let i = 0; i < req.files.length; i += BATCH) {
      const lote = req.files.slice(i, i + BATCH);
      const settled = await Promise.allSettled(lote.map(uploadToCloudinary));
      settled.forEach(r => { if (r.status === 'fulfilled') cloudinaryResults.push(r.value); });
    }

    const guardadas = [];
    for (const resultado of cloudinaryResults) {
      const [r] = await db.query(
        'INSERT INTO proyectos_fotos (proyecto_id, url, public_id) VALUES (?,?,?)',
        [req.params.id, resultado.secure_url, resultado.public_id]
      );
      guardadas.push({ id: r.insertId, url: resultado.secure_url });
    }

    res.status(201).json({ mensaje: `${guardadas.length} foto(s) subida(s)`, fotos: guardadas });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE foto de proyecto
router.delete('/fotos/:id', async (req, res) => {
  try {
    const [fotos] = await db.query('SELECT * FROM proyectos_fotos WHERE id = ?', [req.params.id]);
    if (!fotos.length) return res.status(404).json({ error: 'Foto no encontrada' });
    await cloudinary.uploader.destroy(fotos[0].public_id);
    await db.query('DELETE FROM proyectos_fotos WHERE id = ?', [req.params.id]);
    res.json({ mensaje: 'Foto eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST agregar unidad
router.post('/:id/unidades', async (req, res) => {
  try {
    const { titulo, tipo, precio, habitaciones, banos, metros, disponible } = req.body;
    const [result] = await db.query(
      'INSERT INTO proyecto_unidades (proyecto_id, titulo, tipo, precio, habitaciones, banos, metros, disponible) VALUES (?,?,?,?,?,?,?,?)',
      [req.params.id, titulo, tipo, precio, habitaciones, banos, metros, disponible !== undefined ? disponible : 1]
    );
    res.status(201).json({ id: result.insertId, mensaje: 'Unidad agregada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT editar unidad
router.put('/unidades/:id', async (req, res) => {
  try {
    const { titulo, tipo, precio, habitaciones, banos, metros, disponible } = req.body;
    await db.query(
      'UPDATE proyecto_unidades SET titulo=?, tipo=?, precio=?, habitaciones=?, banos=?, metros=?, disponible=? WHERE id=?',
      [titulo, tipo, precio, habitaciones, banos, metros, disponible, req.params.id]
    );
    res.json({ mensaje: 'Unidad actualizada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH toggle disponible de unidad
router.patch('/unidades/:id/disponible', async (req, res) => {
  try {
    const result = await db.query('SELECT disponible FROM proyecto_unidades WHERE id = ?', [req.params.id]);
    const rows = result[0];
    if (!rows.length) return res.status(404).json({ error: 'Unidad no encontrada' });
    const nuevoValor = rows[0].disponible ? 0 : 1;
    await db.query('UPDATE proyecto_unidades SET disponible = ? WHERE id = ?', [nuevoValor, req.params.id]);
    res.json({ disponible: nuevoValor });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE unidad
router.delete('/unidades/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM proyecto_unidades WHERE id = ?', [req.params.id]);
    res.json({ mensaje: 'Unidad eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;