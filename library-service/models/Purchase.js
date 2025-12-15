const { DataTypes, Op } = require('sequelize');
const sequelize = require('../database');

const Purchase = sequelize.define('Purchase', {
    // ===== RELATIONS =====
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'ID de l\'utilisateur propriétaire'
    },
    gameId: {
        type: DataTypes.INTEGER,
        allowNull: true, // Null si ajout manuel
        comment: 'ID du jeu dans le store (null si ajout manuel)'
    },

    // ===== GESTION DU STATUT =====
    status: {
        type: DataTypes.ENUM(
            'wishlist',   // Liste de souhaits
            'to_play',    // À jouer (backlog)
            'playing',    // En cours
            'completed',  // Terminé
            'abandoned',  // Abandonné
            'mastered'    // 100% complété
        ),
        allowNull: false,
        defaultValue: 'to_play'
    },

    // ===== SOURCE & PLATEFORME =====
    source: {
        type: DataTypes.ENUM('mist_store', 'manual', 'steam_import', 'epic_import'),
        allowNull: false,
        defaultValue: 'mist_store'
    },
    platform: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Steam, Epic, GOG, etc. (pour jeux manuels)'
    },
    launchPath: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'steam://rungameid/730 ou chemin exe'
    },

    // ===== CONTENU UTILISATEUR =====
    customTitle: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Titre du jeu (si ajout manuel)'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    customImage: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'URL image custom (jeux manuels)'
    },
    rating: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: { min: 0, max: 5 }
    },

    // ===== TRACKING =====
    playTime: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Temps de jeu en minutes'
    },
    startedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    completedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },

    // ===== FLAGS =====
    isFavorite: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    isHidden: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'purchases',
    timestamps: true,
    indexes: [
        // Index unique seulement si gameId n'est pas null (jeux du store)
        {
            fields: ['userId', 'gameId'],
            unique: true,
            where: { gameId: { [Op.ne]: null } }
        },
        { fields: ['userId', 'status', 'isFavorite', 'createdAt'] },
        { fields: ['status'] }, // Index pour filtrer par statut
        { fields: ['isFavorite'] },
        { fields: ['source'] }
    ]
});

module.exports = Purchase;
