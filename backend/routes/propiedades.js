const express = require('express');
const router  = express.Router();
const { upload } = require('../config/cloudinary');
const db = require('../config/db');
const {
  getPropiedades,
  getPropiedad,
  crearPropiedad,
  editarPropiedad,
  eliminarPropiedad,
  subirFotos,
  eliminarFoto,
} = require('../controllers/propiedadesController');

/**
 * @swagger
 * components:
 *   schemas:
 *     Propiedad:
 *       type: object
 *       required:
 *         - titulo
 *         - precio
 *       properties:
 *         id:
 *           type: integer
 *         titulo:
 *           type: string
 *           example: Casa moderna en El Vecino
 *         precio:
 *           type: number
 *           example: 189000
 *         zona:
 *           type: string
 *           example: El Vecino
 *         tipo:
 *           type: string
 *           enum: [Venta, Arriendo]
 *           example: Venta
 *         habitaciones:
 *           type: integer
 *           example: 4
 *         banos:
 *           type: integer
 *           example: 3
 *         metros:
 *           type: integer
 *           example: 240
 *         descripcion:
 *           type: string
 *           example: Hermosa casa con jardín y garaje
 *         creado_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/propiedades:
 *   get:
 *     summary: Obtener todas las propiedades
 *     tags: [Propiedades]
 *     parameters:
 *       - in: query
 *         name: zona
 *         schema:
 *           type: string
 *         description: Filtrar por zona
 *         example: Totoracocha
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [Venta, Arriendo]
 *         description: Filtrar por tipo
 *       - in: query
 *         name: precio_max
 *         schema:
 *           type: number
 *         description: Filtrar por precio máximo
 *         example: 200000
 *     responses:
 *       200:
 *         description: Lista de propiedades
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Propiedad'
 */
router.get('/', getPropiedades);

/**
 * @swagger
 * /api/propiedades/{id}:
 *   get:
 *     summary: Obtener una propiedad por ID
 *     tags: [Propiedades]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Propiedad encontrada con sus fotos
 *       404:
 *         description: Propiedad no encontrada
 */
router.get('/:id', getPropiedad);

/**
 * @swagger
 * /api/propiedades:
 *   post:
 *     summary: Crear una nueva propiedad
 *     tags: [Propiedades]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Propiedad'
 *           example:
 *             titulo: Casa nueva en Yanuncay
 *             precio: 150000
 *             zona: Yanuncay
 *             tipo: Venta
 *             habitaciones: 3
 *             banos: 2
 *             metros: 200
 *             descripcion: Casa con jardín y garaje
 *     responses:
 *       201:
 *         description: Propiedad creada correctamente
 *       400:
 *         description: Título y precio son obligatorios
 */
router.post('/', crearPropiedad);

/**
 * @swagger
 * /api/propiedades/{id}:
 *   put:
 *     summary: Editar una propiedad existente
 *     tags: [Propiedades]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Propiedad'
 *     responses:
 *       200:
 *         description: Propiedad actualizada correctamente
 *       404:
 *         description: Propiedad no encontrada
 */
router.put('/:id', editarPropiedad);

/**
 * @swagger
 * /api/propiedades/{id}:
 *   delete:
 *     summary: Eliminar una propiedad y sus fotos
 *     tags: [Propiedades]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Propiedad eliminada correctamente
 *       404:
 *         description: Propiedad no encontrada
 */
router.delete('/:id', eliminarPropiedad);

/**
 * @swagger
 * /api/propiedades/{id}/fotos:
 *   post:
 *     summary: Subir fotos de una propiedad
 *     tags: [Propiedades]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               fotos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Fotos subidas correctamente
 *       400:
 *         description: No se enviaron fotos
 *       404:
 *         description: Propiedad no encontrada
 */
router.post('/:id/fotos', (req, res, next) => {
  upload.array('fotos', 30)(req, res, (err) => {
    if (err) return res.status(400).json({ error: `Error procesando archivos: ${err.message}` });
    next();
  });
}, subirFotos);

/**
 * @swagger
 * /api/propiedades/fotos/{id}:
 *   delete:
 *     summary: Eliminar una foto específica
 *     tags: [Propiedades]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Foto eliminada correctamente
 *       404:
 *         description: Foto no encontrada
 */
router.delete('/fotos/:id', eliminarFoto);

// PATCH /api/propiedades/:id/destacada — actualizar solo el campo destacada
router.patch('/:id/destacada', async (req, res) => {
  try {
    const { destacada } = req.body;
    await db.query(
      'UPDATE propiedades SET destacada = ? WHERE id = ?',
      [destacada ? 1 : 0, req.params.id]
    );
    res.json({ mensaje: 'Propiedad actualizada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;