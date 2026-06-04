require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const swaggerUi    = require('swagger-ui-express');
const swaggerSpec  = require('./config/swagger');

require('./config/db');

const propiedadesRoutes = require('./routes/propiedades');
const mensajesRoutes    = require('./routes/mensajes');
const parroquiasRoutes = require('./routes/parroquias');
const sectoresRoutes   = require('./routes/sectores');
const proyectosRoutes  = require('./routes/proyectos');

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.options('/{*path}', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Swagger ──────────────────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ── Rutas ────────────────────────────────────────────
app.use('/api/propiedades', propiedadesRoutes);
app.use('/api/mensajes',    mensajesRoutes);
app.use('/api/parroquias', parroquiasRoutes);
app.use('/api/sectores',   sectoresRoutes);
app.use('/api/proyectos',  proyectosRoutes);
app.use('/api/testimonios', require('./routes/testimonios'));
app.use('/api/equipo',      require('./routes/equipo'));
app.use('/api/servicios',   require('./routes/servicios'));


app.use('/api/configuracion', require('./routes/configuracion'));
// ── Ruta raíz ────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    estado:       'ok',
    mensaje:      'API Cuencasa funcionando',
    version:      '1.0.0',
    documentacion: 'http://localhost:3000/api/docs',
  });
});

// ── 404 ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// ── Errores globales ─────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📋 Documentación en http://localhost:${PORT}/api/docs`);
});