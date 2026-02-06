const request = require('supertest');
const jwt = require('jsonwebtoken');

// Set JWT_SECRET before requiring app
process.env.JWT_SECRET = 'test-secret';

// Mock the Purchase model before requiring app
const mockPurchase = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
};

jest.mock('../models/Purchase', () => mockPurchase);

const app = require('../app');

// Helper to generate a valid JWT cookie
function authCookie(userId, username = 'testuser') {
    const token = jwt.sign({ id: userId, username }, process.env.JWT_SECRET);
    return `token=${token}`;
}

beforeEach(() => {
    jest.clearAllMocks();
});

// ============================================================
// AUTH MIDDLEWARE
// ============================================================

describe('Auth Middleware', () => {
    test('should return 401 without token', async () => {
        const res = await request(app).get('/user/1');
        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Authentication required');
    });

    test('should return 403 with invalid token', async () => {
        const res = await request(app)
            .get('/user/1')
            .set('Cookie', 'token=invalid-jwt-token');
        expect(res.status).toBe(403);
        expect(res.body.error).toBe('Invalid or expired token');
    });
});

// ============================================================
// GET /user/:id - Library
// ============================================================

describe('GET /user/:id', () => {
    test('should return user library', async () => {
        const mockLibrary = [
            { id: 1, userId: 1, gameId: 101, status: 'playing' },
        ];
        mockPurchase.findAll.mockResolvedValue(mockLibrary);

        const res = await request(app)
            .get('/user/1')
            .set('Cookie', authCookie(1));

        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockLibrary);
    });

    test('should return 403 when accessing another user library', async () => {
        const res = await request(app)
            .get('/user/999')
            .set('Cookie', authCookie(1));

        expect(res.status).toBe(403);
        expect(res.body.error).toBe('Access denied');
    });
});

// ============================================================
// POST /buy
// ============================================================

describe('POST /buy', () => {
    test('should add a game to library', async () => {
        const created = { id: 1, userId: 1, gameId: 42, status: 'to_play', source: 'mist_store' };
        mockPurchase.findOne.mockResolvedValue(null);
        mockPurchase.create.mockResolvedValue(created);

        const res = await request(app)
            .post('/buy')
            .set('Cookie', authCookie(1))
            .send({ gameId: 42 });

        expect(res.status).toBe(201);
        expect(res.body.gameId).toBe(42);
    });

    test('should return 400 without gameId', async () => {
        const res = await request(app)
            .post('/buy')
            .set('Cookie', authCookie(1))
            .send({});

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('gameId is required');
    });

    test('should return 409 for duplicate game', async () => {
        mockPurchase.findOne.mockResolvedValue({ id: 1 });

        const res = await request(app)
            .post('/buy')
            .set('Cookie', authCookie(1))
            .send({ gameId: 42 });

        expect(res.status).toBe(409);
        expect(res.body.error).toBe('Game already in library');
    });
});

// ============================================================
// POST /add-manual
// ============================================================

describe('POST /add-manual', () => {
    test('should add a manual game', async () => {
        const created = { id: 2, userId: 1, customTitle: 'My Game', source: 'manual' };
        mockPurchase.create.mockResolvedValue(created);

        const res = await request(app)
            .post('/add-manual')
            .set('Cookie', authCookie(1))
            .send({ title: 'My Game', platform: 'Steam' });

        expect(res.status).toBe(201);
        expect(res.body.customTitle).toBe('My Game');
    });

    test('should return 400 without title', async () => {
        const res = await request(app)
            .post('/add-manual')
            .set('Cookie', authCookie(1))
            .send({ platform: 'Steam' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('title is required');
    });

    test('should return 400 with empty title', async () => {
        const res = await request(app)
            .post('/add-manual')
            .set('Cookie', authCookie(1))
            .send({ title: '   ' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('title is required');
    });
});

// ============================================================
// PATCH /purchase/:id/status
// ============================================================

describe('PATCH /purchase/:id/status', () => {
    test('should update status to playing', async () => {
        const mockPurch = { id: 1, userId: 1, status: 'to_play', startedAt: null, save: jest.fn() };
        mockPurchase.findByPk.mockResolvedValue(mockPurch);

        const res = await request(app)
            .patch('/purchase/1/status')
            .set('Cookie', authCookie(1))
            .send({ status: 'playing' });

        expect(res.status).toBe(200);
        expect(mockPurch.status).toBe('playing');
        expect(mockPurch.startedAt).toBeTruthy();
        expect(mockPurch.save).toHaveBeenCalled();
    });

    test('should set completedAt when status is completed', async () => {
        const mockPurch = { id: 1, userId: 1, status: 'playing', save: jest.fn() };
        mockPurchase.findByPk.mockResolvedValue(mockPurch);

        const res = await request(app)
            .patch('/purchase/1/status')
            .set('Cookie', authCookie(1))
            .send({ status: 'completed' });

        expect(res.status).toBe(200);
        expect(mockPurch.completedAt).toBeTruthy();
    });

    test('should return 400 for invalid status', async () => {
        const res = await request(app)
            .patch('/purchase/1/status')
            .set('Cookie', authCookie(1))
            .send({ status: 'invalid_status' });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('Invalid status');
    });

    test('should return 404 for non-existent purchase', async () => {
        mockPurchase.findByPk.mockResolvedValue(null);

        const res = await request(app)
            .patch('/purchase/999/status')
            .set('Cookie', authCookie(1))
            .send({ status: 'playing' });

        expect(res.status).toBe(404);
    });

    test('should return 403 for another users purchase', async () => {
        mockPurchase.findByPk.mockResolvedValue({ id: 1, userId: 999 });

        const res = await request(app)
            .patch('/purchase/1/status')
            .set('Cookie', authCookie(1))
            .send({ status: 'playing' });

        expect(res.status).toBe(403);
    });
});

// ============================================================
// PATCH /purchase/:id/rating
// ============================================================

describe('PATCH /purchase/:id/rating', () => {
    test('should update rating', async () => {
        const mockPurch = { id: 1, userId: 1, rating: null, save: jest.fn() };
        mockPurchase.findByPk.mockResolvedValue(mockPurch);

        const res = await request(app)
            .patch('/purchase/1/rating')
            .set('Cookie', authCookie(1))
            .send({ rating: 4 });

        expect(res.status).toBe(200);
        expect(mockPurch.rating).toBe(4);
    });

    test('should accept rating 0', async () => {
        const mockPurch = { id: 1, userId: 1, rating: 3, save: jest.fn() };
        mockPurchase.findByPk.mockResolvedValue(mockPurch);

        const res = await request(app)
            .patch('/purchase/1/rating')
            .set('Cookie', authCookie(1))
            .send({ rating: 0 });

        expect(res.status).toBe(200);
        expect(mockPurch.rating).toBe(0);
    });

    test('should return 400 for rating > 5', async () => {
        const res = await request(app)
            .patch('/purchase/1/rating')
            .set('Cookie', authCookie(1))
            .send({ rating: 6 });

        expect(res.status).toBe(400);
    });

    test('should return 400 for negative rating', async () => {
        const res = await request(app)
            .patch('/purchase/1/rating')
            .set('Cookie', authCookie(1))
            .send({ rating: -1 });

        expect(res.status).toBe(400);
    });

    test('should return 400 for non-integer rating', async () => {
        const res = await request(app)
            .patch('/purchase/1/rating')
            .set('Cookie', authCookie(1))
            .send({ rating: 3.5 });

        expect(res.status).toBe(400);
    });
});

// ============================================================
// GET /purchase/:id/launch
// ============================================================

describe('GET /purchase/:id/launch', () => {
    test('should return launch URL', async () => {
        mockPurchase.findByPk.mockResolvedValue({
            id: 1,
            userId: 1,
            launchPath: 'steam://rungameid/730',
            customTitle: 'CS2',
            platform: 'Steam',
        });

        const res = await request(app)
            .get('/purchase/1/launch')
            .set('Cookie', authCookie(1));

        expect(res.status).toBe(200);
        expect(res.body.launchUrl).toBe('steam://rungameid/730');
        expect(res.body.title).toBe('CS2');
        expect(res.body.platform).toBe('Steam');
    });

    test('should return 400 when no launchPath', async () => {
        mockPurchase.findByPk.mockResolvedValue({
            id: 1,
            userId: 1,
            launchPath: null,
            customTitle: 'Test Game',
        });

        const res = await request(app)
            .get('/purchase/1/launch')
            .set('Cookie', authCookie(1));

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('No launch path');
    });

    test('should return 404 for non-existent purchase', async () => {
        mockPurchase.findByPk.mockResolvedValue(null);

        const res = await request(app)
            .get('/purchase/999/launch')
            .set('Cookie', authCookie(1));

        expect(res.status).toBe(404);
    });

    test('should return 403 for another users game', async () => {
        mockPurchase.findByPk.mockResolvedValue({
            id: 1,
            userId: 999,
            launchPath: 'steam://rungameid/730',
        });

        const res = await request(app)
            .get('/purchase/1/launch')
            .set('Cookie', authCookie(1));

        expect(res.status).toBe(403);
    });
});

// ============================================================
// POST /import
// ============================================================

describe('POST /import', () => {
    test('should import games', async () => {
        mockPurchase.findOne.mockResolvedValue(null);
        mockPurchase.create.mockResolvedValue({});

        const res = await request(app)
            .post('/import')
            .set('Cookie', authCookie(1))
            .send({
                games: [
                    { title: 'Game A', image: 'img.jpg', playtime: 120 },
                    { title: 'Game B', image: 'img2.jpg', playtime: 60 },
                ]
            });

        expect(res.status).toBe(200);
        expect(res.body.count).toBe(2);
        expect(mockPurchase.create).toHaveBeenCalledTimes(2);
    });

    test('should skip duplicates', async () => {
        mockPurchase.findOne
            .mockResolvedValueOnce({ id: 1 })  // Game A exists
            .mockResolvedValueOnce(null);       // Game B doesn't
        mockPurchase.create.mockResolvedValue({});

        const res = await request(app)
            .post('/import')
            .set('Cookie', authCookie(1))
            .send({
                games: [
                    { title: 'Game A', image: 'img.jpg', playtime: 120 },
                    { title: 'Game B', image: 'img2.jpg', playtime: 60 },
                ]
            });

        expect(res.status).toBe(200);
        expect(res.body.count).toBe(1);
    });

    test('should return 400 for empty games array', async () => {
        const res = await request(app)
            .post('/import')
            .set('Cookie', authCookie(1))
            .send({ games: [] });

        expect(res.status).toBe(400);
    });

    test('should return 400 when games is not an array', async () => {
        const res = await request(app)
            .post('/import')
            .set('Cookie', authCookie(1))
            .send({ games: 'not an array' });

        expect(res.status).toBe(400);
    });
});
