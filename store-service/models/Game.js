const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    title: { type: String, required: true },
    description: String,
    image: String,
    genre: [String],
    releaseDate: Date,
    rating: Number,
    publisher: String,
    developer: String,
    tags: [String], // Pour filtrage avancé (Singleplayer, Multiplayer, Co-op, etc.)
    features: [String], // Steam Cloud, Controller Support, Achievements, etc.
    languages: [String], // Langues supportées
    reviewsCount: { type: Number, default: 0 }, // Nombre d'avis
    platform: [String], // Windows, Mac, Linux, Steam Deck
    isEarlyAccess: { type: Boolean, default: false },
    lastPriceUpdate: { type: Date }, // Date de la dernière mise à jour des prix
    bestDeal: { // Le meilleur deal trouvé
        store: String,
        price: Number,
        retailPrice: Number,
        savings: Number,
        dealLink: String
    },
    allDeals: [{ // Tous les deals trouvés
        store: String,
        price: Number,
        retailPrice: Number,
        savings: Number,
        dealLink: String
    }]
});

// Index pour la recherche full-text
GameSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Game', GameSchema);