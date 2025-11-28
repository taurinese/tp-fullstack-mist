const express = require('express');
const morgan = require('morgan');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const dealsRoutes = require('./routes/deals');
const steamRoutes = require('./routes/library');

const app = express();

app.use(morgan('dev'));
app.use(express.json());

// --- SWAGGER CONFIGURATION ---
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'Import Service API',
            version: '1.0.0',
            description: 'API for fetching external game data (deals, steam library)',
        },
        servers: [
            {
                url: 'http://localhost:3003',
                description: 'Import Service (Direct)',
            },
            {
                url: 'http://localhost:3000/api/import',
                description: 'Import Service (via Gateway)',
            },
        ],
    },
    apis: ['./index.js', './routes/*.js'], // Scan les routes dans les sous-dossiers
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


app.use('/deals', dealsRoutes);
app.use('/steam', steamRoutes);


/**
 * @swagger
 * /:
 *   get:
 *     summary: Healthcheck
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Service is online
 */
app.get('/', (req, res) => {
    res.json({ status: "Import Service Online" });
});

app.listen(3003, () => {
    console.log('🔌 Import Service running on port 3003');
});