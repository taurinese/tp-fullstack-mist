const express = require('express');
const morgan = require('morgan');
const connectDB = require('./database');
const Game = require('./models/Game');
const gamesData = require("./data/games");

const app = express();

app.use(morgan('dev'));
app.use(express.json());

const initApp = async () => {
    await connectDB();

    try {
        const count = await Game.countDocuments();
        if (count === 0) {
            await Game.insertMany(gamesData);
            console.log('--- Jeux de test insérés ---');
        }
    } catch (err) {
        console.error("Erreur lors du seed:", err);
    }
};

initApp();

// IMPORTANT : Les routes spécifiques doivent être AVANT la route /:id

// Endpoint pour obtenir tous les genres disponibles
app.get('/filters/genres', async (req, res) => {
    try {
        const genres = await Game.distinct('genre');
        res.json(genres);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint pour obtenir tous les tags disponibles
app.get('/filters/tags', async (req, res) => {
    try {
        const tags = await Game.distinct('tags');
        res.json(tags);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint pour les jeux en promotion
app.get('/specials/discounts', async (req, res) => {
    try {
        const games = await Game.find({ discount: { $gt: 0 } }).sort({ discount: -1 });
        res.json(games);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint pour les jeux populaires
app.get('/specials/popular', async (req, res) => {
    try {
        const games = await Game.find().sort({ reviewsCount: -1 }).limit(10);
        res.json(games);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint pour les nouvelles sorties
app.get('/specials/new-releases', async (req, res) => {
    try {
        const games = await Game.find().sort({ releaseDate: -1 }).limit(10);
        res.json(games);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/', async (req, res) => {
    try {
        const { search, genre, tag, minPrice, maxPrice, platform, sortBy, onlyDiscount } = req.query;
        let query = {};

        // Recherche textuelle (titre, description, tags)
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } },
                { developer: { $regex: search, $options: 'i' } },
                { publisher: { $regex: search, $options: 'i' } }
            ];
        }

        // Filtrage par genre
        if (genre) {
            query.genre = { $in: genre.split(',') };
        }

        // Filtrage par tag
        if (tag) {
            query.tags = { $in: tag.split(',') };
        }

        // Filtrage par prix
        if (minPrice !== undefined || maxPrice !== undefined) {
            query.price = {};
            if (minPrice !== undefined) query.price.$gte = parseFloat(minPrice);
            if (maxPrice !== undefined) query.price.$lte = parseFloat(maxPrice);
        }

        // Filtrage par plateforme
        if (platform) {
            query.platform = { $in: platform.split(',') };
        }

        // Uniquement les jeux en promotion
        if (onlyDiscount === 'true') {
            query.discount = { $gt: 0 };
        }

        // Tri
        let sort = {};
        switch (sortBy) {
            case 'price_asc':
                sort.price = 1;
                break;
            case 'price_desc':
                sort.price = -1;
                break;
            case 'rating':
                sort.rating = -1;
                break;
            case 'releaseDate':
                sort.releaseDate = -1;
                break;
            case 'popular':
                sort.reviewsCount = -1;
                break;
            default:
                sort.title = 1;
        }

        const games = await Game.find(query).sort(sort);
        res.json(games);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/:id', async (req, res) => {
    try {
        const game = await Game.findOne({ id: req.params.id });
        if (!game) return res.status(404).json({ message: 'Jeu non trouvé' });
        res.json(game);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(3001, () => {
    console.log('Store service running on port 3001');
})