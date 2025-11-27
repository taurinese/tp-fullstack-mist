const express = require('express');
const morgan = require('morgan');
const connectDB = require('./database');
const Game = require('./models/Game');
const gamesData = require("./data/games");
const axios = require('axios'); // Import axios

const PRICE_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour in milliseconds
const IMPORT_SERVICE_URL = "http://import-service:3003/deals/search"; // Internal Docker URL

const app = express();

app.use(morgan('dev'));
app.use(express.json());

// Fonction pour récupérer et mettre en cache les prix
async function fetchAndCachePrices(game) {
    const now = new Date();
    // Vérifier si les prix sont déjà à jour
    if (game.lastPriceUpdate && (now.getTime() - game.lastPriceUpdate.getTime() < PRICE_CACHE_TTL_MS)) {
        return game; // Prix toujours valides, pas besoin de rafraîchir
    }

    try {
        console.log(`[Store-Service] Refreshing prices for: ${game.title}`);
        const response = await axios.get(IMPORT_SERVICE_URL, {
            params: { title: game.title }
        });

        const externalDeals = response.data.prices || [];
        
        let bestDeal = null;
        if (externalDeals.length > 0) {
            // Trouver le meilleur deal (le moins cher)
            const sortedDeals = externalDeals.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
            const cheapestDeal = sortedDeals[0];

            bestDeal = {
                store: cheapestDeal.store,
                price: parseFloat(cheapestDeal.price.replace(' $', '')),
                retailPrice: parseFloat(cheapestDeal.retail_price.replace(' $', '')),
                savings: parseFloat(cheapestDeal.savings.replace('%', '')),
                dealLink: cheapestDeal.deal_link
            };
        }

        game.bestDeal = bestDeal;
        game.allDeals = externalDeals.map(deal => ({
            store: deal.store,
            price: parseFloat(deal.price.replace(' $', '')),
            retailPrice: parseFloat(deal.retail_price.replace(' $', '')),
            savings: parseFloat(deal.savings.replace('%', '')),
            dealLink: deal.deal_link
        }));
        game.lastPriceUpdate = now;

        await game.save();
        console.log(`[Store-Service] Prices updated for ${game.title}`);
        return game;

    } catch (error) {
        console.error(`[Store-Service] Error fetching prices for ${game.title}: ${error.message}`);
        // Si l'import-service échoue, on renvoie le jeu tel quel, mais sans mise à jour des prix
        // On ne met pas à jour lastPriceUpdate pour réessayer la prochaine fois
        return game;
    }
}

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

// Endpoint pour les jeux en promotion (Désactivé temporairement ou à refaire avec le cache)
app.get('/specials/discounts', async (req, res) => {
    try {
        // Pour l'instant, on renvoie les jeux ayant un bestDeal.savings > 0 si on a des données en cache
        // Note: Cela ne marchera que pour les jeux déjà visités/cachés.
        const games = await Game.find({ "bestDeal.savings": { $gt: 0 } }).sort({ "bestDeal.savings": -1 }).limit(10);
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

        /* 
        // Filtrage par prix (Désactivé car prix dynamique)
        if (minPrice !== undefined || maxPrice !== undefined) {
            query.price = {};
            if (minPrice !== undefined) query.price.$gte = parseFloat(minPrice);
            if (maxPrice !== undefined) query.price.$lte = parseFloat(maxPrice);
        }
        */

        // Filtrage par plateforme
        if (platform) {
            query.platform = { $in: platform.split(',') };
        }

        /*
        // Uniquement les jeux en promotion (Désactivé car prix dynamique)
        if (onlyDiscount === 'true') {
            query.discount = { $gt: 0 };
        }
        */

        // Tri
        let sort = {};
        switch (sortBy) {
            /*
            case 'price_asc':
                sort.price = 1;
                break;
            case 'price_desc':
                sort.price = -1;
                break;
            */
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

// Route spécifique pour rafraîchir les prix d'un jeu à la demande (Lazy Loading)
app.put('/:id/refresh-prices', async (req, res) => {
    try {
        let game = await Game.findOne({ id: req.params.id });
        if (!game) return res.status(404).json({ message: 'Jeu non trouvé' });

        // Force la mise à jour ou vérifie le cache
        game = await fetchAndCachePrices(game);

        res.json(game);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/:id', async (req, res) => {
    try {
        let game = await Game.findOne({ id: req.params.id });
        if (!game) return res.status(404).json({ message: 'Jeu non trouvé' });

        game = await fetchAndCachePrices(game); // Mettre à jour les prix si nécessaire

        res.json(game);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(3001, () => {
    console.log('Store service running on port 3001');
})