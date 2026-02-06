const Purchase = require('../models/Purchase');

// Helper : recuperer un purchase et verifier qu'il appartient a l'utilisateur
async function findUserPurchase(purchaseId, userId) {
    const purchase = await Purchase.findByPk(purchaseId);
    if (!purchase) return { error: 'Purchase not found', status: 404 };
    if (purchase.userId !== userId) return { error: 'Access denied', status: 403 };
    return { purchase };
}

// GET /user/:id - Recuperer la bibliotheque d'un utilisateur
exports.getUserLibrary = async (req, res) => {
    try {
        const requestedId = parseInt(req.params.id);
        if (req.user.id !== requestedId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const library = await Purchase.findAll({
            where: { userId: req.user.id },
            order: [
                ['isFavorite', 'DESC'],
                ['status', 'ASC'],
                ['createdAt', 'DESC']
            ]
        });
        res.json(library);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET /user/:id/status/:status - Filtrer par statut
exports.getLibraryByStatus = async (req, res) => {
    try {
        const requestedId = parseInt(req.params.id);
        if (req.user.id !== requestedId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const library = await Purchase.findAll({
            where: {
                userId: req.user.id,
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
};

// POST /buy - Ajouter un jeu du store a la bibliotheque
exports.buyGame = async (req, res) => {
    try {
        const userId = req.user.id;
        const { gameId } = req.body;

        if (!gameId) {
            return res.status(400).json({ error: 'gameId is required' });
        }

        const existing = await Purchase.findOne({ where: { userId, gameId } });
        if (existing) {
            return res.status(409).json({ error: 'Game already in library' });
        }

        const newPurchase = await Purchase.create({
            userId,
            gameId,
            status: 'to_play',
            source: 'mist_store'
        });
        res.status(201).json(newPurchase);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// POST /add-manual - Ajouter un jeu manuellement
exports.addManualGame = async (req, res) => {
    try {
        const userId = req.user.id;
        const { title, platform, launchPath, customImage, status, notes } = req.body;

        if (!title || title.trim().length === 0) {
            return res.status(400).json({ error: 'title is required' });
        }

        const manualGame = await Purchase.create({
            userId,
            gameId: null,
            customTitle: title.trim(),
            status: status || 'to_play',
            source: 'manual',
            platform,
            launchPath,
            customImage,
            notes
        });

        res.status(201).json(manualGame);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// POST /import - Importer des jeux depuis une source externe
exports.importGames = async (req, res) => {
    try {
        const userId = req.user.id;
        const { games } = req.body;

        if (!Array.isArray(games) || games.length === 0) {
            return res.status(400).json({ error: 'games must be a non-empty array' });
        }

        let importedCount = 0;

        for (const game of games) {
            const exists = await Purchase.findOne({
                where: {
                    userId,
                    customTitle: game.title
                }
            });

            if (!exists) {
                await Purchase.create({
                    userId,
                    source: 'steam_import',
                    customTitle: game.title,
                    customImage: game.image,
                    playTime: game.playtime,
                    status: 'to_play'
                });
                importedCount++;
            }
        }

        res.json({ message: `${importedCount} games imported`, count: importedCount });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Valeurs autorisees pour le statut
const VALID_STATUSES = ['wishlist', 'to_play', 'playing', 'completed', 'abandoned', 'mastered'];

// PATCH /purchase/:id/status - Mettre a jour le statut
exports.updateStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!status || !VALID_STATUSES.includes(status)) {
            return res.status(400).json({
                error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
            });
        }

        const result = await findUserPurchase(req.params.id, req.user.id);
        if (result.error) return res.status(result.status).json({ error: result.error });
        const { purchase } = result;

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
};

// PATCH /purchase/:id/rating - Mettre a jour la note
exports.updateRating = async (req, res) => {
    try {
        const { rating } = req.body;

        if (rating === undefined || rating === null || rating < 0 || rating > 5 || !Number.isInteger(rating)) {
            return res.status(400).json({ error: 'Rating must be an integer between 0 and 5' });
        }

        const result = await findUserPurchase(req.params.id, req.user.id);
        if (result.error) return res.status(result.status).json({ error: result.error });
        const { purchase } = result;

        purchase.rating = rating;
        await purchase.save();

        res.json(purchase);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// PATCH /purchase/:id/favorite - Toggle favori
exports.toggleFavorite = async (req, res) => {
    try {
        const result = await findUserPurchase(req.params.id, req.user.id);
        if (result.error) return res.status(result.status).json({ error: result.error });
        const { purchase } = result;

        purchase.isFavorite = !purchase.isFavorite;
        await purchase.save();

        res.json(purchase);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// PATCH /purchase/:id/notes - Mettre a jour les notes
exports.updateNotes = async (req, res) => {
    try {
        const result = await findUserPurchase(req.params.id, req.user.id);
        if (result.error) return res.status(result.status).json({ error: result.error });
        const { purchase } = result;

        purchase.notes = req.body.notes;
        await purchase.save();

        res.json(purchase);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// PATCH /purchase/:id/details - Mettre a jour launchPath et platform
exports.updateDetails = async (req, res) => {
    try {
        const result = await findUserPurchase(req.params.id, req.user.id);
        if (result.error) return res.status(result.status).json({ error: result.error });
        const { purchase } = result;

        const { launchPath, platform } = req.body;
        if (launchPath !== undefined) purchase.launchPath = launchPath;
        if (platform !== undefined) purchase.platform = platform;
        await purchase.save();

        res.json(purchase);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET /purchase/:id/launch - Lancer un jeu
exports.launchGame = async (req, res) => {
    try {
        const result = await findUserPurchase(req.params.id, req.user.id);
        if (result.error) return res.status(result.status).json({ error: result.error });
        const { purchase } = result;

        if (!purchase.launchPath) {
            return res.status(400).json({
                error: 'No launch path configured for this game',
                hint: 'Edit the game details to add a launch path (e.g. steam://rungameid/730)'
            });
        }

        res.json({
            launchUrl: purchase.launchPath,
            title: purchase.customTitle || `Game #${purchase.gameId}`,
            platform: purchase.platform
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
