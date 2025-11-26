const { DataTypes } = require('sequelize');
const sequelize = require('../database'); // On importe la connexion

const Purchase = sequelize.define('Purchase', {
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    gameId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
});

module.exports = Purchase;