const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const sequelize = require('./database');
const User = require('./models/User');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { validateAuthData } = require('./utils/validation');

const app = express();
const PORT = process.env.PORT || 3004;
const JWT_SECRET = process.env.JWT_SECRET;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Configuration CORS pour accepter les cookies du frontend
app.use(cors({
    origin: ['http://localhost:8080', 'http://localhost:5173'], // Frontend URLs
    credentials: true // Important pour les cookies
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

// Middleware pour vérifier le token JWT depuis le cookie
const authenticateToken = (req, res, next) => {
    const token = req.cookies.token; // Lecture depuis le cookie

    if (!token) return res.sendStatus(401); // Pas de token

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403); // Token invalide ou expiré
        req.user = user;
        next();
    });
};

// --- SWAGGER CONFIGURATION ---
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'User Service API',
            version: '1.0.0',
            description: 'API for user authentication and management',
        },
        servers: [
            {
                url: `http://localhost:${PORT}`, // URL du service user
                description: 'User Service (Direct)',
            },
            {
                url: `http://localhost:3000/api/user`, // URL via API Gateway
                description: 'User Service (via Gateway)',
            },
        ],
        components: {
            securitySchemes: {
                cookieAuth: {
                    type: 'apiKey',
                    in: 'cookie',
                    name: 'token'
                }
            }
        },
        security: [{
            cookieAuth: []
        }]
    },
    apis: ['./index.js'], // Fichier où les commentaires Swagger sont définis
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Route pour la spécification OpenAPI (JSON)
app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

// Route pour l'interface utilisateur Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --- ROUTES ---

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: testuser
 *               email:
 *                 type: string
 *                 format: email
 *                 example: test@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       201:
 *         description: User registered successfully
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: token=eyJhb...; Path=/; HttpOnly; SameSite=Lax
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 username:
 *                   type: string
 *                   example: testuser
 *                 email:
 *                   type: string
 *                   example: test@example.com
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Username must be at least 3 characters long.
 */
app.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const validationErrors = validateAuthData(username, email, password, true);
        if (validationErrors.length > 0) {
            return res.status(400).json({ error: validationErrors.join(', ') });
        }
        
        const user = await User.create({ username, email, password });
        
        // Générer le token immédiatement pour connecter l'utilisateur
        const token = jwt.sign(
            { id: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Envoyer le cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: IS_PRODUCTION, // false en dev, true en prod
            sameSite: 'lax', // Protection CSRF raisonnable
            maxAge: 24 * 60 * 60 * 1000 // 24h
        });

        res.status(201).json({ 
            id: user.id, 
            username: user.username, 
            email: user.email 
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Log in a user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: test@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: User logged in successfully
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: token=eyJhb...; Path=/; HttpOnly; SameSite=Lax
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     username:
 *                       type: string
 *                       example: testuser
 *                     email:
 *                       type: string
 *                       example: test@example.com
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Email ou mot de passe incorrect
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid email format.
 */
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const validationErrors = validateAuthData(null, email, password, false); // Username n'est pas requis pour login
        if (validationErrors.length > 0) {
            return res.status(400).json({ error: validationErrors.join(', ') });
        }
        
        const user = await User.findOne({ where: { email } });

        if (!user || !(await user.validatePassword(password))) {
            return res.status(401).json({ error: "Email ou mot de passe incorrect" });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Envoyer le cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: IS_PRODUCTION,
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000
        });

        // On ne renvoie plus le token dans le body
        res.json({ user: { id: user.id, username: user.username, email: user.email } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /logout:
 *   post:
 *     summary: Log out a user
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User logged out successfully
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT
 */
app.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: "Déconnecté" });
});

/**
 * @swagger
 * /me:
 *   get:
 *     summary: Get current user information
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Current user data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 username:
 *                   type: string
 *                   example: testuser
 *                 email:
 *                   type: string
 *                   example: test@example.com
 *                 role:
 *                   type: string
 *                   example: user
 *       401:
 *         description: Unauthorized (No token or invalid token)
 *       404:
 *         description: User not found
 */
app.get('/me', authenticateToken, async (req, res) => {
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
    if (!user) return res.sendStatus(404);
    res.json(user);
});

// --- DÉMARRAGE AVEC RETRY ---
async function initDB() {
    try {
        await sequelize.authenticate();
        console.log('✅ PostgreSQL (User Service) connecté');

        await sequelize.sync({ alter: true });
        console.log('✅ Tables synchronisées');

        app.listen(PORT, () => {
            console.log(`🔐 User Service running on port ${PORT}`);
        });
    } catch (error) {
        console.error('❌ Erreur connexion BDD:', error.message);
        console.log('🔄 Tentative de reconnexion dans 5 secondes...');
        setTimeout(initDB, 5000);
    }
}

initDB();