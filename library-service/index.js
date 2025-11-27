const express = require('express');
const morgan = require('morgan');
const sequelize = require('./database');
const Purchase = require('./models/Purchase');

const app = express();
app.use(morgan('dev'));
app.use(express.json());

async function initDB(){
    try {
        // Test de la connexion
        await sequelize.authenticate();
        console.log('✅ PostgreSQL connecté');

        // Synchroniser le modèle (créer les tables)
        await sequelize.sync({ alter: true }); // alter: true pour mettre à jour le schéma
        console.log('✅ Tables synchronisées');

        const count = await Purchase.count();
        if (count === 0) {
            await Purchase.bulkCreate([
                {userId: 1, gameId: 101},
                {userId: 1, gameId: 102}
            ]);
            console.log('✅ Données de test insérées');
        } else {
            console.log(`ℹ️  ${count} purchase(s) déjà en base`);
        }
    } catch(error) {
        console.error('❌ Erreur BDD:', error.message);
        console.error('Détails:', error);
        // Réessayer après 5 secondes si la connexion échoue
        setTimeout(initDB, 5000);
    }
}
initDB();

app.get('/user/:id', async (req, res) => {
    try {
        const library = await Purchase.findAll({
            where: { userId: req.params.id },
            order: [
                ['isFavorite', 'DESC'], // Favoris en premier
                ['status', 'ASC'],      // Puis par statut
                ['createdAt', 'DESC']   // Puis par date d'achat
            ]
        });
        res.json(library);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/buy', async (req, res) => {
    try {
        const { userId, gameId } = req.body;
        const newPurchase = await Purchase.create({
            userId,
            gameId,
            status: 'to_play',      // Défaut: dans le backlog
            source: 'mist_store'    // Acheté via le store Mist
        });
        res.json(newPurchase);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mettre à jour le statut d'un jeu
app.patch('/purchase/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const purchase = await Purchase.findByPk(req.params.id);

        if (!purchase) {
            return res.status(404).json({ error: 'Purchase not found' });
        }

        // Mettre à jour les dates selon le statut
        if (status === 'playing' && !purchase.startedAt) {
            purchase.startedAt = new Date();
        }
        if (status === 'completed' || status === 'mastered') {
            purchase.completedAt = new Date();
        }

        purchase.status = status;
        await purchase.save();

        res.json(purchase);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mettre à jour la note d'un jeu
app.patch('/purchase/:id/rating', async (req, res) => {
    try {
        const { rating } = req.body;
        const purchase = await Purchase.findByPk(req.params.id);

        if (!purchase) {
            return res.status(404).json({ error: 'Purchase not found' });
        }

        purchase.rating = rating;
        await purchase.save();

        res.json(purchase);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Toggle favori
app.patch('/purchase/:id/favorite', async (req, res) => {
    try {
        const purchase = await Purchase.findByPk(req.params.id);

        if (!purchase) {
            return res.status(404).json({ error: 'Purchase not found' });
        }

        purchase.isFavorite = !purchase.isFavorite;
        await purchase.save();

        res.json(purchase);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mettre à jour les notes
app.patch('/purchase/:id/notes', async (req, res) => {
    try {
        const { notes } = req.body;
        const purchase = await Purchase.findByPk(req.params.id);

        if (!purchase) {
            return res.status(404).json({ error: 'Purchase not found' });
        }

        purchase.notes = notes;
        await purchase.save();

        res.json(purchase);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Filtrer par statut
app.get('/user/:id/status/:status', async (req, res) => {
    try {
        const library = await Purchase.findAll({
            where: {
                userId: req.params.id,
                status: req.params.status
            },
            order: [
                ['isFavorite', 'DESC'],
                ['createdAt', 'DESC']
            ]
        });
        res.json(library);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Ajout manuel d'un jeu
app.post('/add-manual', async (req, res) => {
    try {
        const { userId, title, platform, launchPath, customImage, status, notes } = req.body;

        const manualGame = await Purchase.create({
            userId,
            gameId: null, // Pas de gameId car ajout manuel
            customTitle: title, // Titre personnalisé
            status: status || 'to_play',
            source: 'manual',
            platform,
            launchPath,
            customImage,
            notes
        });

        res.json(manualGame);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3002, () => {
    console.log('Library service running on port 3001');
})