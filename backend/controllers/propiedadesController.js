const db = require('../config/db');
const { cloudinary } = require('../config/cloudinary');

// Reemplaza los sectores relacionados de una propiedad por la lista recibida.
// `sectores` es un arreglo de ids de sector (puede venir undefined o vacio).
const sincronizarSectoresRelacionados = async (propiedadId, sectores) => {
  await db.query('DELETE FROM propiedad_sectores WHERE propiedad_id = ?', [propiedadId]);
  if (!Array.isArray(sectores) || !sectores.length) return;
  const ids = [...new Set(sectores.map(Number).filter(Boolean))];
  if (!ids.length) return;
  const values = ids.map(() => '(?, ?)').join(', ');
  const params = ids.flatMap(id => [propiedadId, id]);
  await db.query(`INSERT INTO propiedad_sectores (propiedad_id, sector_id) VALUES ${values}`, params);
};

const getPropiedades = async (req, res) => {
  try {
    const { parroquia_id, sector_id, tipo, precio_max, precio_min, habitaciones, destacadas } = req.query;

    let query = `
      SELECT p.*,
        par.nombre AS parroquia,
        sec.nombre AS sector,
        (SELECT GROUP_CONCAT(ps.sector_id) FROM propiedad_sectores ps WHERE ps.propiedad_id = p.id) AS sectores_rel_ids,
        (SELECT url FROM fotos WHERE propiedad_id = p.id LIMIT 1) AS foto_principal
      FROM propiedades p
      LEFT JOIN parroquias par ON par.id = p.parroquia_id
      LEFT JOIN sectores   sec ON sec.id = p.sector_id
      WHERE 1=1
    `;
    const params = [];

    if (destacadas)   { query += ' AND p.destacada = 1'; }
    if (parroquia_id) { query += ' AND p.parroquia_id = ?'; params.push(parroquia_id); }
    if (sector_id)    { query += ' AND p.sector_id = ?';    params.push(sector_id); }
    if (tipo)         { query += ' AND p.tipo = ?';         params.push(tipo); }
    if (precio_min)   { query += ' AND p.precio >= ?';      params.push(precio_min); }
    if (precio_max)   { query += ' AND p.precio <= ?';      params.push(precio_max); }
    if (habitaciones) { query += ' AND p.habitaciones >= ?'; params.push(habitaciones); }

    if (req.query.metros_min) { 
  query += ' AND p.metros >= ?'; 
  params.push(req.query.metros_min); 
}
if (req.query.parqueadero) {
  query += ' AND p.parqueadero > 0';
}
    
    // Búsqueda por texto libre — busca en parroquia, sector y título
if (req.query.zona) {
  query += ` AND (
    par.nombre LIKE ? OR 
    sec.nombre LIKE ? OR 
    p.titulo   LIKE ?
  )`;
  const t = `%${req.query.zona}%`;
  params.push(t, t, t);
}

    query += ' ORDER BY p.destacada DESC, p.creado_at DESC';

    const [propiedades] = await db.query(query, params);
    res.json(propiedades);
  } catch (error) {
    console.error('Error getPropiedades:', error.message);
    res.status(500).json({ error: 'Error obteniendo propiedades' });
  }
};

// GET /api/propiedades/:id
const getPropiedad = async (req, res) => {
  try {
    const [propiedades] = await db.query(
      `SELECT p.*, par.nombre AS parroquia, sec.nombre AS sector
       FROM propiedades p
       LEFT JOIN parroquias par ON par.id = p.parroquia_id
       LEFT JOIN sectores   sec ON sec.id = p.sector_id
       WHERE p.id = ?`,
      [req.params.id]
    );

    if (propiedades.length === 0) {
      return res.status(404).json({ error: 'Propiedad no encontrada' });
    }

    const [fotos] = await db.query(
      'SELECT * FROM fotos WHERE propiedad_id = ?',
      [req.params.id]
    );

    const [relacionados] = await db.query(
      `SELECT s.id, s.nombre
       FROM propiedad_sectores ps
       JOIN sectores s ON s.id = ps.sector_id
       WHERE ps.propiedad_id = ?`,
      [req.params.id]
    );

    res.json({ ...propiedades[0], fotos, sectores_relacionados: relacionados });

  } catch (error) {
    console.error('Error getPropiedad:', error.message);
    res.status(500).json({ error: 'Error obteniendo propiedad' });
  }
};

const crearPropiedad = async (req, res) => {
  try {
    const { titulo, precio, tipo, gestion, dueno_nombre, dueno_telefono, habitaciones, banos, metros, metros_terreno, metros_construccion, plantas, parqueadero, antiguedad, descripcion, tipo_unidad, link_mapa, link_recorrido, link_video, codigo, link_facebook, link_instagram, link_tiktok, destacada, parroquia_id, sector_id, sectores_relacionados } = req.body;
    if (!titulo || !precio) return res.status(400).json({ error: 'Título y precio son obligatorios' });
    const [result] = await db.query(
      `INSERT INTO propiedades (titulo, precio, tipo, gestion, dueno_nombre, dueno_telefono, habitaciones, banos, metros, metros_terreno, metros_construccion, plantas, parqueadero, antiguedad, descripcion, tipo_unidad, link_mapa, link_recorrido, link_video, codigo, link_facebook, link_instagram, link_tiktok, destacada, parroquia_id, sector_id)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [titulo, precio, tipo, gestion, dueno_nombre, dueno_telefono, habitaciones, banos, metros, metros_terreno, metros_construccion, plantas, parqueadero||0, antiguedad, descripcion, tipo_unidad||null, link_mapa, link_recorrido, link_video||null, codigo||null, link_facebook||null, link_instagram||null, link_tiktok||null, destacada||0, parroquia_id, sector_id]
    );
    await sincronizarSectoresRelacionados(result.insertId, sectores_relacionados);
    res.status(201).json({ mensaje: 'Propiedad creada', id: result.insertId });
  } catch (error) {
    console.error('Error crearPropiedad:', error.message);
    res.status(500).json({ error: 'Error creando propiedad' });
  }
};

const editarPropiedad = async (req, res) => {
  try {
    const { titulo, precio, tipo, gestion, dueno_nombre, dueno_telefono, habitaciones, banos, metros, metros_terreno, metros_construccion, plantas, parqueadero, antiguedad, descripcion, tipo_unidad, link_mapa, link_recorrido, link_video, codigo, link_facebook, link_instagram, link_tiktok, destacada, parroquia_id, sector_id, sectores_relacionados } = req.body;
    const [existe] = await db.query('SELECT id FROM propiedades WHERE id = ?', [req.params.id]);
    if (!existe.length) return res.status(404).json({ error: 'Propiedad no encontrada' });
    await db.query(
      `UPDATE propiedades SET titulo=?, precio=?, tipo=?, gestion=?, dueno_nombre=?, dueno_telefono=?, habitaciones=?, banos=?, metros=?, metros_terreno=?, metros_construccion=?, plantas=?, parqueadero=?, antiguedad=?, descripcion=?, tipo_unidad=?, link_mapa=?, link_recorrido=?, link_video=?, codigo=?, link_facebook=?, link_instagram=?, link_tiktok=?, destacada=?, parroquia_id=?, sector_id=? WHERE id=?`,
      [titulo, precio, tipo, gestion, dueno_nombre, dueno_telefono, habitaciones, banos, metros, metros_terreno, metros_construccion, plantas, parqueadero||0, antiguedad, descripcion, tipo_unidad||null, link_mapa, link_recorrido, link_video||null, codigo||null, link_facebook||null, link_instagram||null, link_tiktok||null, destacada||0, parroquia_id, sector_id, req.params.id]
    );
    if (sectores_relacionados !== undefined) {
      await sincronizarSectoresRelacionados(req.params.id, sectores_relacionados);
    }
    res.json({ mensaje: 'Propiedad actualizada' });
  } catch (error) {
    console.error('Error editarPropiedad:', error.message);
    res.status(500).json({ error: 'Error editando propiedad' });
  }
};

// DELETE /api/propiedades/:id
const eliminarPropiedad = async (req, res) => {
  try {
    const [fotos] = await db.query(
      'SELECT public_id FROM fotos WHERE propiedad_id = ?',
      [req.params.id]
    );

    for (const foto of fotos) {
      await cloudinary.uploader.destroy(foto.public_id);
    }

    await db.query('DELETE FROM propiedad_sectores WHERE propiedad_id = ?', [req.params.id]);
    await db.query('DELETE FROM propiedades WHERE id = ?', [req.params.id]);

    res.json({ mensaje: 'Propiedad eliminada correctamente' });

  } catch (error) {
    console.error('Error eliminarPropiedad:', error.message);
    res.status(500).json({ error: 'Error eliminando propiedad' });
  }
};

// POST /api/propiedades/:id/fotos
const subirFotos = async (req, res) => {
  try {
    console.log('=== SUBIR FOTOS ===');
    console.log('Propiedad ID:', req.params.id);
    console.log('Files:', req.files ? req.files.length : 0);

    const [existe] = await db.query(
      'SELECT id FROM propiedades WHERE id = ?',
      [req.params.id]
    );

    if (existe.length === 0) {
      return res.status(404).json({ error: 'Propiedad no encontrada' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No se enviaron fotos' });
    }

    const uploadToCloudinary = (file) => new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'cuencasa/propiedades', timeout: 60000 },
        (error, result) => error ? reject(error) : resolve(result)
      );
      stream.end(file.buffer);
    });

    // Subir en lotes de 5 para no saturar Cloudinary
    const BATCH = 5;
    const cloudinaryResults = [];
    for (let i = 0; i < req.files.length; i += BATCH) {
      const lote = req.files.slice(i, i + BATCH);
      const settled = await Promise.allSettled(lote.map(uploadToCloudinary));
      settled.forEach(r => { if (r.status === 'fulfilled') cloudinaryResults.push(r.value); });
    }

    const fotosGuardadas = [];
    for (const resultado of cloudinaryResults) {
      const [result] = await db.query(
        'INSERT INTO fotos (propiedad_id, url, public_id) VALUES (?, ?, ?)',
        [req.params.id, resultado.secure_url, resultado.public_id]
      );
      fotosGuardadas.push({ id: result.insertId, url: resultado.secure_url });
    }

    res.status(201).json({
      mensaje: `${fotosGuardadas.length} foto(s) subida(s) correctamente`,
      fotos:   fotosGuardadas,
    });

  } catch (error) {
    console.error('=== ERROR subirFotos ===', error.message);
    res.status(500).json({ error: error.message });
  }
};
// DELETE /api/fotos/:id
const eliminarFoto = async (req, res) => {
  try {
    const [fotos] = await db.query(
      'SELECT * FROM fotos WHERE id = ?',
      [req.params.id]
    );

    if (fotos.length === 0) {
      return res.status(404).json({ error: 'Foto no encontrada' });
    }

    await cloudinary.uploader.destroy(fotos[0].public_id);
    await db.query('DELETE FROM fotos WHERE id = ?', [req.params.id]);

    res.json({ mensaje: 'Foto eliminada correctamente' });

  } catch (error) {
    console.error('Error eliminarFoto:', error.message);
    res.status(500).json({ error: 'Error eliminando foto' });
  }
};

module.exports = {
  getPropiedades,
  getPropiedad,
  crearPropiedad,
  editarPropiedad,
  eliminarPropiedad,
  subirFotos,
  eliminarFoto,
}; 