const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    title: { type: String, required: true },
    price: { type: Number, required: true },
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
    discount: { type: Number, default: 0 }, // Pourcentage de réduction
    reviewsCount: { type: Number, default: 0 }, // Nombre d'avis
    platform: [String], // Windows, Mac, Linux, Steam Deck
    isEarlyAccess: { type: Boolean, default: false }
});

// Index pour la recherche full-text
GameSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Game', GameSchema);