const express = require('express');
const router = express.Router();
const libraryController = require('../controllers/libraryController');
const authenticateToken = require('../middleware/auth');

/**
 * @swagger
 * /user/{id}:
 *   get:
 *     summary: Get library for a user
 *     tags: [Library]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User's game library
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied
 */
router.get('/user/:id', authenticateToken, libraryController.getUserLibrary);

/**
 * @swagger
 * /user/{id}/status/{status}:
 *   get:
 *     summary: Get user games filtered by status
 *     tags: [Library]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [wishlist, to_play, playing, completed, abandoned, mastered]
 *         description: Game status filter
 *     responses:
 *       200:
 *         description: Filtered game list
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied
 */
router.get('/user/:id/status/:status', authenticateToken, libraryController.getLibraryByStatus);

/**
 * @swagger
 * /buy:
 *   post:
 *     summary: Add a game to library from the store
 *     tags: [Library]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - gameId
 *             properties:
 *               gameId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Game added to library
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Authentication required
 *       409:
 *         description: Game already in library
 */
router.post('/buy', authenticateToken, libraryController.buyGame);

/**
 * @swagger
 * /add-manual:
 *   post:
 *     summary: Add a manual game entry
 *     tags: [Library]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *               platform:
 *                 type: string
 *               launchPath:
 *                 type: string
 *               customImage:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [wishlist, to_play, playing, completed, abandoned, mastered]
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Manual game added
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Authentication required
 */
router.post('/add-manual', authenticateToken, libraryController.addManualGame);

/**
 * @swagger
 * /import:
 *   post:
 *     summary: Import games from external source (e.g. Steam)
 *     tags: [Library]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - games
 *             properties:
 *               games:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     image:
 *                       type: string
 *                     playtime:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Games imported successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Authentication required
 */
router.post('/import', authenticateToken, libraryController.importGames);

/**
 * @swagger
 * /purchase/{id}/status:
 *   patch:
 *     summary: Update game status
 *     tags: [Library]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [wishlist, to_play, playing, completed, abandoned, mastered]
 *     responses:
 *       200:
 *         description: Status updated
 *       400:
 *         description: Invalid status
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Not your purchase
 *       404:
 *         description: Purchase not found
 */
router.patch('/purchase/:id/status', authenticateToken, libraryController.updateStatus);

/**
 * @swagger
 * /purchase/{id}/rating:
 *   patch:
 *     summary: Update game rating
 *     tags: [Library]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 5
 *     responses:
 *       200:
 *         description: Rating updated
 *       400:
 *         description: Invalid rating
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Not your purchase
 *       404:
 *         description: Purchase not found
 */
router.patch('/purchase/:id/rating', authenticateToken, libraryController.updateRating);

/**
 * @swagger
 * /purchase/{id}/favorite:
 *   patch:
 *     summary: Toggle favorite status
 *     tags: [Library]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Favorite toggled
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Not your purchase
 *       404:
 *         description: Purchase not found
 */
router.patch('/purchase/:id/favorite', authenticateToken, libraryController.toggleFavorite);

/**
 * @swagger
 * /purchase/{id}/notes:
 *   patch:
 *     summary: Update game notes
 *     tags: [Library]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Notes updated
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Not your purchase
 *       404:
 *         description: Purchase not found
 */
router.patch('/purchase/:id/notes', authenticateToken, libraryController.updateNotes);

/**
 * @swagger
 * /purchase/{id}/details:
 *   patch:
 *     summary: Update game launch path and platform
 *     tags: [Library]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               launchPath:
 *                 type: string
 *                 description: "Deep link or executable path (e.g. steam://rungameid/730)"
 *               platform:
 *                 type: string
 *                 description: "Platform name (e.g. Steam, Epic Games, GOG)"
 *     responses:
 *       200:
 *         description: Details updated
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Not your purchase
 *       404:
 *         description: Purchase not found
 */
router.patch('/purchase/:id/details', authenticateToken, libraryController.updateDetails);

/**
 * @swagger
 * /purchase/{id}/launch:
 *   get:
 *     summary: Get launch URL for a game
 *     tags: [Library]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Launch URL returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 launchUrl:
 *                   type: string
 *                 title:
 *                   type: string
 *                 platform:
 *                   type: string
 *       400:
 *         description: No launch path configured
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Not your purchase
 *       404:
 *         description: Purchase not found
 */
router.get('/purchase/:id/launch', authenticateToken, libraryController.launchGame);

module.exports = router;
