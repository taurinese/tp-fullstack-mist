const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI;

        await mongoose.connect(mongoURI);
        console.log('--- MongoDB connecté ---');
    } catch (err) {
        console.error('Erreur de connexion MongoDB:', err);
    }
};

module.exports = connectDB;