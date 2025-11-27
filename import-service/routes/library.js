const express = require('express');
const router = express.Router();

router.get('/:userId', async (req, res) => {
    const userId = req.params.userId;
    console.log(`🎮 [Steam] Récupération compte ${userId}...`);

    // Mock pour la démo
    const mockSteamGames = [
        { id: 10, title: "Counter-Strike", playtime: 4500, image: "https://placehold.co/100?text=CS" },
        { id: 20, title: "Half-Life 2", playtime: 120, image: "https://placehold.co/100?text=HL2" }
    ];

    setTimeout(() => {
        res.json({
            platform: "steam",
            user: userId,
            games: mockSteamGames
        });
    }, 200);
});

module.exports = router;