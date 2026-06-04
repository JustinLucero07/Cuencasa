const db = require('../config/db');

// GET /api/mensajes
const getMensajes = async (req, res) => {
  try {
    const [mensajes] = await db.query(
      'SELECT * FROM mensajes ORDER BY creado_at DESC'
    );
    res.json(mensajes);

  } catch (error) {
    console.error('Error getMensajes:', error.message);
    res.status(500).json({ error: 'Error obteniendo mensajes' });
  }
};

// POST /api/mensajes
const crearMensaje = async (req, res) => {
  try {
    const { nombre, email, telefono, interes, mensaje } = req.body;

    if (!nombre || !email) {
      return res.status(400).json({ error: 'Nombre y email son obligatorios' });
    }

    const [result] = await db.query(
      `INSERT INTO mensajes (nombre, email, telefono, interes, mensaje)
       VALUES (?, ?, ?, ?, ?)`,
      [nombre, email, telefono, interes, mensaje]
    );

    res.status(201).json({
      mensaje: 'Mensaje enviado correctamente',
      id:      result.insertId,
    });

  } catch (error) {
    console.error('Error crearMensaje:', error.message);
    res.status(500).json({ error: 'Error enviando mensaje' });
  }
};

// PUT /api/mensajes/:id/leido
const marcarLeido = async (req, res) => {
  try {
    const [existe] = await db.query(
      'SELECT id FROM mensajes WHERE id = ?',
      [req.params.id]
    );

    if (existe.length === 0) {
      return res.status(404).json({ error: 'Mensaje no encontrado' });
    }

    await db.query(
      'UPDATE mensajes SET leido = 1 WHERE id = ?',
      [req.params.id]
    );

    res.json({ mensaje: 'Mensaje marcado como leído' });

  } catch (error) {
    console.error('Error marcarLeido:', error.message);
    res.status(500).json({ error: 'Error marcando mensaje' });
  }
};

// DELETE /api/mensajes/:id
const eliminarMensaje = async (req, res) => {
  try {
    const [existe] = await db.query(
      'SELECT id FROM mensajes WHERE id = ?',
      [req.params.id]
    );

    if (existe.length === 0) {
      return res.status(404).json({ error: 'Mensaje no encontrado' });
    }

    await db.query(
      'DELETE FROM mensajes WHERE id = ?',
      [req.params.id]
    );

    res.json({ mensaje: 'Mensaje eliminado correctamente' });

  } catch (error) {
    console.error('Error eliminarMensaje:', error.message);
    res.status(500).json({ error: 'Error eliminando mensaje' });
  }
};

module.exports = {
  getMensajes,
  crearMensaje,
  marcarLeido,
  eliminarMensaje,
};