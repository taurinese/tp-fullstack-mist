const games = [
    {
        id: 101,
        title: "Half-Life 3",
        price: 59.99,
        description: "The anticipated conclusion to the Gordon Freeman saga. Fight through the Combine's stronghold in the Arctic.",
        image: "https://cdn.cloudflare.steamstatic.com/steam/apps/220/header.jpg",
        genre: ["FPS", "Action", "Sci-Fi"],
        releaseDate: new Date("2026-03-03"),
        rating: 5.0,
        publisher: "Valve"
    },
    {
        id: 102,
        title: "Cyberpunk 2078",
        price: 69.99,
        description: "Return to Night City a year later. More neon, more chrome, and a new legend to become.",
        image: "https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/header.jpg",
        genre: ["RPG", "Cyberpunk", "Open World"],
        releaseDate: new Date("2077-12-10"),
        rating: 4.5,
        publisher: "CD Projekt Red"
    },
    {
        id: 103,
        title: "Minecraft 2",
        price: 32.99,
        description: "The ultimate block-building adventure returns with realistic physics and round objects.",
        image: "https://cdn.cloudflare.steamstatic.com/steam/apps/1928870/header.jpg",
        genre: ["Sandbox", "Survival", "Adventure"],
        releaseDate: new Date("2024-05-17"),
        rating: 4.8,
        publisher: "Mojang Studios"
    },
    {
        id: 104,
        title: "Portal 3",
        price: 44.99,
        description: "Chell returns to Aperture Science for one last series of tests. Now with time-travel portals.",
        image: "https://cdn.cloudflare.steamstatic.com/steam/apps/620/header.jpg",
        genre: ["Puzzle", "Platformer", "Sci-Fi"],
        releaseDate: new Date("2025-10-10"),
        rating: 4.9,
        publisher: "Valve"
    },
    {
        id: 105,
        title: "GTA VI: Vice City Stories",
        price: 79.99,
        description: "Explore the sun-soaked streets of Vice City in the most immersive open world ever created.",
        image: "https://cdn.cloudflare.steamstatic.com/steam/apps/271590/header.jpg",
        genre: ["Action", "Open World", "Crime"],
        releaseDate: new Date("2025-04-01"),
        rating: 4.7,
        publisher: "Rockstar Games"
    },
    {
        id: 106,
        title: "The Elder Scrolls VI",
        price: 74.99,
        description: "Travel to Hammerfell and High Rock in the next chapter of the Elder Scrolls saga.",
        image: "https://cdn.cloudflare.steamstatic.com/steam/apps/489830/header.jpg",
        genre: ["RPG", "Fantasy", "Open World"],
        releaseDate: new Date("2026-11-11"),
        rating: 4.6,
        publisher: "Bethesda Softworks"
    },
    {
        id: 107,
        title: "Hollow Knight: Silksong",
        price: 29.99,
        description: "Discover a vast, haunted kingdom in this sequel to the award-winning action-adventure.",
        image: "https://cdn.cloudflare.steamstatic.com/steam/apps/367520/header.jpg",
        genre: ["Metroidvania", "Action", "Indie"],
        releaseDate: new Date("2024-02-24"),
        rating: 4.9,
        publisher: "Team Cherry"
    },
    {
        id: 108,
        title: "Bloodborne Remastered",
        price: 39.99,
        description: "Face your nightmares in Yharnam with stunning 4K visuals and 60fps gameplay.",
        image: "https://cdn.cloudflare.steamstatic.com/steam/apps/1627720/header.jpg",
        genre: ["Action", "RPG", "Horror"],
        releaseDate: new Date("2025-01-01"),
        rating: 4.8,
        publisher: "FromSoftware"
    },
    {
        id: 109,
        title: "The Sims 5",
        price: 0.00,
        description: "Create unique Sims, build their dream homes, and let them live their best lives. Base game free.",
        image: "https://cdn.cloudflare.steamstatic.com/steam/apps/1222670/header.jpg",
        genre: ["Simulation", "Life", "Strategy"],
        releaseDate: new Date("2025-06-01"),
        rating: 4.2,
        publisher: "Electronic Arts"
    },
    {
        id: 110,
        title: "Zelda: Tears of the Developers",
        price: 69.99,
        description: "Link's newest adventure pushes the hardware limits further than ever before.",
        image: "https://upload.wikimedia.org/wikipedia/en/c/c6/The_Legend_of_Zelda_Breath_of_the_Wild.jpg",
        genre: ["Adventure", "Action", "Fantasy"],
        releaseDate: new Date("2023-05-12"),
        rating: 5.0,
        publisher: "Nintendo"
    },
    {
        id: 111,
        title: "FIFA 2050",
        price: 71.99,
        description: "Experience the beautiful game with hyper-realistic graphics and mind-reading AI opponents.",
        image: "https://cdn.cloudflare.steamstatic.com/steam/apps/1811260/header.jpg",
        genre: ["Sports", "Simulation", "Multiplayer"],
        releaseDate: new Date("2049-09-29"),
        rating: 3.5,
        publisher: "EA Sports"
    },
    {
        id: 112,
        title: "Star Citizen: Full Release",
        price: 49.99,
        description: "The premier space simulation experience. Explore a persistent universe with no loading screens.",
        image: "https://upload.wikimedia.org/wikipedia/en/6/66/Star_Citizen_logo.png",
        genre: ["Space Sim", "MMO", "Sci-Fi"],
        releaseDate: new Date("2030-01-01"),
        rating: 3.0,
        publisher: "Cloud Imperium Games"
    },
    {
        id: 113,
        title: "Team Fortress 3",
        price: 0.00,
        description: "The hat simulator returns with more classes, more guns, and even more hats.",
        image: "https://cdn.cloudflare.steamstatic.com/steam/apps/440/header.jpg",
        genre: ["FPS", "Action", "Multiplayer"],
        releaseDate: new Date("2024-10-10"),
        rating: 4.8,
        publisher: "Valve"
    },
    {
        id: 114,
        title: "Witcher 4: Ciri's Tale",
        price: 69.99,
        description: "Follow Ciri in a new saga across the Northern Kingdoms and beyond.",
        image: "https://cdn.cloudflare.steamstatic.com/steam/apps/292030/header.jpg",
        genre: ["RPG", "Fantasy", "Open World"],
        releaseDate: new Date("2026-05-19"),
        rating: 4.9,
        publisher: "CD Projekt Red"
    },
    {
        id: 115,
        title: "Doom: Hugs & Kisses",
        price: 12.99,
        description: "Rip and tear? No, hug and share! Spreading love across Mars.",
        image: "https://cdn.cloudflare.steamstatic.com/steam/apps/782330/header.jpg",
        genre: ["FPS", "Family", "Action"],
        releaseDate: new Date("2024-02-14"),
        rating: 4.7,
        publisher: "Bethesda Softworks"
    },
    {
        id: 116,
        title: "Mario Kart 10",
        price: 59.99,
        description: "Race against your friends in the most chaotic kart racer yet. Now with anti-gravity 2.0.",
        image: "https://upload.wikimedia.org/wikipedia/en/b/b5/Mario_Kart_8_Deluxe_Box_Art.jpg",
        genre: ["Racing", "Multiplayer", "Family"],
        releaseDate: new Date("2025-04-28"),
        rating: 4.8,
        publisher: "Nintendo"
    },
    {
        id: 117,
        title: "Dark Souls 4",
        price: 69.99,
        description: "The fire fades... and the difficulty spikes. Prepare to die again.",
        image: "https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/header.jpg",
        genre: ["RPG", "Action", "Souls-like"],
        releaseDate: new Date("2025-03-24"),
        rating: 4.9,
        publisher: "FromSoftware"
    },
    {
        id: 118,
        title: "Stardew Valley 3D",
        price: 19.99,
        description: "Farm, fish, and find love in Pelican Town, now in full glorious 3D.",
        image: "https://cdn.cloudflare.steamstatic.com/steam/apps/413150/header.jpg",
        genre: ["Simulation", "Farming", "Indie"],
        releaseDate: new Date("2024-02-26"),
        rating: 4.9,
        publisher: "ConcernedApe"
    },
    {
        id: 119,
        title: "Among Us VR 2",
        price: 14.99,
        description: "Trust no one. The imposter is closer than you think in this immersive sequel.",
        image: "https://cdn.cloudflare.steamstatic.com/steam/apps/945360/header.jpg",
        genre: ["Social Deduction", "Multiplayer", "VR"],
        releaseDate: new Date("2024-11-15"),
        rating: 4.5,
        publisher: "Innersloth"
    },
    {
        id: 120,
        title: "League of Legends 2",
        price: 0.00,
        description: "The MOBA defined a generation. Now redefined. New engine, same competitive spirit.",
        image: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Ahri_0.jpg",
        genre: ["MOBA", "Strategy", "Multiplayer"],
        releaseDate: new Date("2025-01-01"),
        rating: 4.6,
        publisher: "Riot Games"
    }
];

module.exports = games;