const Game = require('../models/Game');
const axios = require('axios');

const PRICE_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const IMPORT_SERVICE_URL = "http://import-service:3003/deals/search";

// Fonction interne : recuperer et mettre en cache les prix
async function fetchAndCachePrices(game) {
    const now = new Date();
    if (game.lastPriceUpdate && (now.getTime() - game.lastPriceUpdate.getTime() < PRICE_CACHE_TTL_MS)) {
        return game;
    }

    try {
        console.log(`[Store-Service] Refreshing prices for: ${game.title}`);
        const response = await axios.get(IMPORT_SERVICE_URL, {
            params: { title: game.title }
        });

        const externalDeals = response.data.prices || [];

        let bestDeal = null;
        if (externalDeals.length > 0) {
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
        return game;
    }
}

// GET / - Liste des jeux avec filtres et tri
exports.getAllGames = async (req, res) => {
    try {
        const { search, genre, tag, platform, sortBy } = req.query;
        let query = {};

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } },
                { developer: { $regex: search, $options: 'i' } },
                { publisher: { $regex: search, $options: 'i' } }
            ];
        }

        if (genre) {
            query.genre = { $in: genre.split(',') };
        }

        if (tag) {
            query.tags = { $in: tag.split(',') };
        }

        if (platform) {
            query.platform = { $in: platform.split(',') };
        }

        let sort = {};
        switch (sortBy) {
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
};

// GET /filters/genres
exports.getGenres = async (req, res) => {
    try {
        const genres = await Game.distinct('genre');
        res.json(genres);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /filters/tags
exports.getTags = async (req, res) => {
    try {
        const tags = await Game.distinct('tags');
        res.json(tags);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /specials/discounts
exports.getDiscounts = async (req, res) => {
    try {
        const games = await Game.find({ "bestDeal.savings": { $gt: 0 } })
            .sort({ "bestDeal.savings": -1 })
            .limit(10);
        res.json(games);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /specials/popular
exports.getPopular = async (req, res) => {
    try {
        const games = await Game.find().sort({ reviewsCount: -1 }).limit(10);
        res.json(games);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /specials/new-releases
exports.getNewReleases = async (req, res) => {
    try {
        const games = await Game.find().sort({ releaseDate: -1 }).limit(10);
        res.json(games);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// PUT /:id/refresh-prices
exports.refreshPrices = async (req, res) => {
    try {
        let game = await Game.findOne({ id: req.params.id });
        if (!game) return res.status(404).json({ message: 'Jeu non trouve' });

        game = await fetchAndCachePrices(game);
        res.json(game);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /:id - Detail d'un jeu
exports.getGameById = async (req, res) => {
    try {
        let game = await Game.findOne({ id: req.params.id });
        if (!game) return res.status(404).json({ message: 'Jeu non trouve' });

        game = await fetchAndCachePrices(game);
        res.json(game);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
