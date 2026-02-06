const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const sequelize = require('./database');
const Purchase = require('./models/Purchase');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const libraryRoutes = require('./routes/library');

const app = express();
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

// --- SWAGGER CONFIGURATION ---
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'Library Service API',
            version: '1.0.0',
            description: 'API for managing user game libraries',
        },
        servers: [
            {
                url: 'http://localhost:3002',
                description: 'Library Service (Direct)',
            },
            {
                url: 'http://localhost:3000/api/library',
                description: 'Library Service (via Gateway)',
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
app.use('/', libraryRoutes);

// --- INIT ---
async function initDB() {
    try {
        await sequelize.authenticate();
        console.log('PostgreSQL connecte');

        await sequelize.sync({ alter: true });
        console.log('Tables synchronisees');

        const count = await Purchase.count();
        if (count === 0) {
            await Purchase.bulkCreate([
                { userId: 1, gameId: 101 },
                { userId: 1, gameId: 102 }
            ]);
            console.log('Donnees de test inserees');
        } else {
            console.log(`${count} purchase(s) deja en base`);
        }
    } catch (error) {
        console.error('Erreur BDD:', error.message);
        setTimeout(initDB, 5000);
    }
}
initDB();

app.listen(3002, () => {
    console.log('Library service running on port 3002');
});
