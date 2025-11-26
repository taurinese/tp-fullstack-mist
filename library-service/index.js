const express = require('express');
const morgan = require('morgan');
const sequelize = require('./database');
const Purchase = require('./models/Purchase');

const app = express();
app.use(morgan('dev'));
app.use(express.json());

async function initDB(){
    try {
        await sequelize.sync();

        const count = await Purchase.count();
        if (count === 0) {
            await Purchase.bulkCreate([
                {userId: 1, gameId: 101},
                {userId: 1, gameId: 102}
            ]);
            console.log('--- Données de test insérées ---');
        }
    } catch(error) {
        console.error('Erreur BDD:', error);
    }
}
initDB();

app.get('/user/:id', async (req, res) => {
    const library = await Purchase.findAll({ where: { userId: req.params.id } });
    res.json(library);
});

app.post('/buy', async (req, res) => {
    const { userId, gameId } = req.body;
    const newPurchase = await Purchase.create({ userId, gameId });
    res.json(newPurchase);
});

app.listen(3002, () => {
    console.log('Library service running on port 3001');
})