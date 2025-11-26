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

app.get('/', async (req, res) => {
    try {
        const games = await Game.find();
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