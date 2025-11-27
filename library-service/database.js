const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    database: process.env.POSTGRES_DB || 'mist_library',
    username: process.env.POSTGRES_USER || 'mist',
    password: process.env.POSTGRES_PASSWORD || 'mist_password',
    logging: false
});

module.exports = sequelize;