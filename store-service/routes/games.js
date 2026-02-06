const express = require('express');
const router = express.Router();
const gamesController = require('../controllers/gamesController');

/**
 * @swagger
 * /filters/genres:
 *   get:
 *     summary: Get all available game genres
 *     tags: [Filters]
 *     responses:
 *       200:
 *         description: List of genres
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 */
router.get('/filters/genres', gamesController.getGenres);

/**
 * @swagger
 * /filters/tags:
 *   get:
 *     summary: Get all available game tags
 *     tags: [Filters]
 *     responses:
 *       200:
 *         description: List of tags
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 */
router.get('/filters/tags', gamesController.getTags);

/**
 * @swagger
 * /specials/discounts:
 *   get:
 *     summary: Get games with active discounts
 *     tags: [Specials]
 *     responses:
 *       200:
 *         description: List of discounted games
 */
router.get('/specials/discounts', gamesController.getDiscounts);

/**
 * @swagger
 * /specials/popular:
 *   get:
 *     summary: Get popular games
 *     tags: [Specials]
 *     responses:
 *       200:
 *         description: List of popular games
 */
router.get('/specials/popular', gamesController.getPopular);

/**
 * @swagger
 * /specials/new-releases:
 *   get:
 *     summary: Get new game releases
 *     tags: [Specials]
 *     responses:
 *       200:
 *         description: List of new games
 */
router.get('/specials/new-releases', gamesController.getNewReleases);

/**
 * @swagger
 * /:
 *   get:
 *     summary: Get all games with filtering and sorting
 *     tags: [Games]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for title, description, or tags
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *         description: Comma-separated list of genres
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *         description: Comma-separated list of tags
 *       - in: query
 *         name: platform
 *         schema:
 *           type: string
 *         description: Comma-separated list of platforms
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [rating, releaseDate, popular, title]
 *         description: Sort criteria
 *     responses:
 *       200:
 *         description: List of games matching criteria
 */
router.get('/', gamesController.getAllGames);

/**
 * @swagger
 * /{id}/refresh-prices:
 *   put:
 *     summary: Force refresh prices for a game
 *     tags: [Games]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Game ID
 *     responses:
 *       200:
 *         description: Game with updated prices
 *       404:
 *         description: Game not found
 */
router.put('/:id/refresh-prices', gamesController.refreshPrices);

/**
 * @swagger
 * /{id}:
 *   get:
 *     summary: Get a game by ID
 *     tags: [Games]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Game ID
 *     responses:
 *       200:
 *         description: Game details
 *       404:
 *         description: Game not found
 */
router.get('/:id', gamesController.getGameById);

module.exports = router;
