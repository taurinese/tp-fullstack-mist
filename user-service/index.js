const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const sequelize = require('./database');
const User = require('./models/User');

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

// Fonction de validation simple
function validateAuthData(username, email, password, isRegistering = false) {
    const errors = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Regex basique

    if (isRegistering && (!username || username.length < 3)) {
        errors.push("Username must be at least 3 characters long.");
    }

    if (!email || !emailRegex.test(email)) {
        errors.push("Invalid email format.");
    }

    if (!password || password.length < 6) {
        errors.push("Password must be at least 6 characters long.");
    }

    return errors;
}

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

// --- ROUTES ---

// Inscription
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

// Connexion
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

// Déconnexion
app.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: "Déconnecté" });
});

// Vérification du token (Exemple de route protégée)
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
