const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const sequelize = require('./database');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 3004;
const JWT_SECRET = process.env.JWT_SECRET;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Middleware pour vérifier le token JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401); // Pas de token

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
        const user = await User.create({ username, email, password });
        
        // On ne renvoie jamais le mot de passe
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
        const user = await User.findOne({ where: { email } });

        if (!user || !(await user.validatePassword(password))) {
            return res.status(401).json({ error: "Email ou mot de passe incorrect" });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Vérification du token (Exemple de route protégée)
// Applique le middleware authenticateToken avant d'exécuter la logique de la route
app.get('/me', authenticateToken, async (req, res) => {
    // req.user est défini par le middleware
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
    if (!user) return res.sendStatus(404); // L'utilisateur n'existe plus
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