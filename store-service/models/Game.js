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
    publisher: String
});

module.exports = mongoose.model('Game', GameSchema);