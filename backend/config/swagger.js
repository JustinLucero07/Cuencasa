const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title:       'API Cuencasa',
      version:     '1.0.0',
      description: 'API REST para el sistema de bienes raíces Cuencasa',
    },
    servers: [
      {
        url:         'https://cuencasa-production-7b46.up.railway.app',
        description: 'Servidor Railway (producción)',
      },
      {
        url:         'http://localhost:3000',
        description: 'Servidor local (desarrollo)',
      },
    ],
  },
  apis: ['./routes/*.js'],
};

module.exports = swaggerJsdoc(options);