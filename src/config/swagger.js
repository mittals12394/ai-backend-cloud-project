const swaggerJsDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AI Backend API',
      version: '1.0.0',
      description: 'API documentation for backend project'
    },
    servers: [
      {
        url: 'http://localhost:8080'
      }
    ],
    components: {
        schemas: {
            User: {
            type: 'object',
            properties: {
                _id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
                age: { type: 'number' }
            }
            }
        }
}
  },
  apis: ['./src/routes/*.js'] // where docs will be written
};



const swaggerSpec = swaggerJsDoc(options);

module.exports = swaggerSpec;
