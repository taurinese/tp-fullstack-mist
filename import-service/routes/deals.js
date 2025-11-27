const express = require('express');
const axios = require('axios');
const router = express.Router();

// --- CONFIGURATION : TABLE DE CORRESPONDANCE ---
// CheapShark utilise des IDs, on les traduit en noms lisibles pour ton Front
const STORE_MAPPING = {
    "1": "Steam",
    "7": "GOG",
    "25": "Epic Games",
    "11": "Humble Store",
    "13": "Uplay (Ubisoft)",
    "2": "GamersGate"
    // Microsoft Store n'est pas toujours fiable sur CheapShark, on se concentre sur les PC majeurs
};

// Route A : Les "Hot Deals" (Pour ta page d'accueil)
// Celle-ci reste utile pour montrer des jeux au hasard
router.get('/', async (req, res) => {
    try {
        console.log("🔥 [Deals] Récupération des promos globales...");
        const response = await axios.get('https://www.cheapshark.com/api/1.0/deals', {
            params: { storeID: 1, upperPrice: 50, AAA: 1, pageSize: 6 }
        });

        // On garde la logique simple pour l'accueil
        res.json(response.data.map(d => ({
            title: d.title,
            price: d.salePrice + " $",
            image: d.thumb,
            deal_id: d.dealID
        })));
    } catch (e) {
        res.status(503).json([]);
    }
});

// Route B : LE COMPARATEUR (Recherche précise)
// Appel : GET /api/import/deals/search?title=cyberpunk
router.get('/search', async (req, res) => {
    const title = req.query.title;

    if (!title) return res.status(400).json({ error: "Titre requis" });

    try {
        console.log(`🔍 [Comparateur] Recherche de : ${title}`);

        // ÉTAPE 1 : Trouver l'ID du jeu
        const searchRes = await axios.get(`https://www.cheapshark.com/api/1.0/games?title=${title}&limit=1`);

        if (searchRes.data.length === 0) {
            return res.status(404).json({ message: "Jeu non trouvé" });
        }

        const gameID = searchRes.data[0].gameID;
        const gameName = searchRes.data[0].external; // Le vrai nom propre (ex: "Cyberpunk 2077")
        const gameThumb = searchRes.data[0].thumb;

        // ÉTAPE 2 : Récupérer TOUS les prix pour ce jeu
        const detailsRes = await axios.get(`https://www.cheapshark.com/api/1.0/games?id=${gameID}`);
        const allDeals = detailsRes.data.deals;

        // ÉTAPE 3 : Filtrer et formater pour ton Front
        // On ne garde que les magasins qu'on connait (Steam, Epic, GOG...)
        const comparison = [];

        allDeals.forEach(deal => {
            const storeName = STORE_MAPPING[deal.storeID];

            // Si le magasin est dans notre liste VIP, on l'ajoute
            if (storeName) {
                comparison.push({
                    store: storeName,
                    price: deal.price + " $",
                    retail_price: deal.retailPrice + " $", // Prix sans promo
                    savings: Math.round(deal.savings) + "%", // Pourcentage de réduction
                    deal_link: `https://www.cheapshark.com/redirect?dealID=${deal.dealID}` // Lien direct vers la boutique
                });
            }
        });

        // Réponse finale formatée
        res.json({
            title: gameName,
            image: gameThumb,
            prices: comparison // Tableau des prix par store
        });

    } catch (e) {
        console.error("Erreur Comparateur", e.message);
        res.status(503).json({ error: "Erreur lors de la comparaison" });
    }
});

module.exports = router;