const express = require('express');
const router  = express.Router();
const {
  getMensajes,
  crearMensaje,
  marcarLeido,
  eliminarMensaje,
} = require('../controllers/mensajesController');

/**
 * @swagger
 * components:
 *   schemas:
 *     Mensaje:
 *       type: object
 *       required:
 *         - nombre
 *         - email
 *       properties:
 *         id:
 *           type: integer
 *         nombre:
 *           type: string
 *           example: Juan Pérez
 *         email:
 *           type: string
 *           example: juan@gmail.com
 *         telefono:
 *           type: string
 *           example: 0991234567
 *         interes:
 *           type: string
 *           example: Comprar una casa
 *         mensaje:
 *           type: string
 *           example: Me interesa la casa de El Vecino
 *         leido:
 *           type: integer
 *           example: 0
 *         creado_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/mensajes:
 *   get:
 *     summary: Obtener todos los mensajes
 *     tags: [Mensajes]
 *     responses:
 *       200:
 *         description: Lista de mensajes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Mensaje'
 */
router.get('/', getMensajes);

/**
 * @swagger
 * /api/mensajes:
 *   post:
 *     summary: Enviar un mensaje de contacto
 *     tags: [Mensajes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Mensaje'
 *           example:
 *             nombre: Juan Pérez
 *             email: juan@gmail.com
 *             telefono: 0991234567
 *             interes: Comprar una casa
 *             mensaje: Me interesa la casa de El Vecino
 *     responses:
 *       201:
 *         description: Mensaje enviado correctamente
 *       400:
 *         description: Nombre y email son obligatorios
 */
router.post('/', crearMensaje);

/**
 * @swagger
 * /api/mensajes/{id}/leido:
 *   put:
 *     summary: Marcar un mensaje como leído
 *     tags: [Mensajes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Mensaje marcado como leído
 *       404:
 *         description: Mensaje no encontrado
 */
router.put('/:id/leido', marcarLeido);

/**
 * @swagger
 * /api/mensajes/{id}:
 *   delete:
 *     summary: Eliminar un mensaje
 *     tags: [Mensajes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Mensaje eliminado correctamente
 *       404:
 *         description: Mensaje no encontrado
 */
router.delete('/:id', eliminarMensaje);

module.exports = router;
