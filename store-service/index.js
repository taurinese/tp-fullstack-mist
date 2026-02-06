const express = require('express');
const morgan = require('morgan');
const connectDB = require('./database');
const Game = require('./models/Game');
const gamesData = require('./data/games');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const gamesRoutes = require('./routes/games');

const app = express();

app.use(morgan('dev'));
app.use(express.json());

// --- SWAGGER CONFIGURATION ---
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'Store Service API',
            version: '1.0.0',
            description: 'API for browsing games catalogue',
        },
        servers: [
            {
                url: 'http://localhost:3001',
                description: 'Store Service (Direct)',
            },
            {
                url: 'http://localhost:3000/api/store',
                description: 'Store Service (via Gateway)',
            },
        ],
    },
    apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --- ROUTES ---
app.use('/', gamesRoutes);

// --- INIT ---
const initApp = async () => {
    await connectDB();

    try {
        const count = await Game.countDocuments();
        if (count === 0) {
            await Game.insertMany(gamesData);
            console.log('--- Jeux de test inseres ---');
        }
    } catch (err) {
        console.error("Erreur lors du seed:", err);
    }
};

initApp();

app.listen(3001, () => {
    console.log('Store service running on port 3001');
});
