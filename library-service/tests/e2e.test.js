const request = require('supertest');
const jwt = require('jsonwebtoken');

// Set JWT_SECRET before requiring app
process.env.JWT_SECRET = 'test-secret';

// Mock the Purchase model
const mockPurchase = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
};

jest.mock('../models/Purchase', () => mockPurchase);

const app = require('../app');

function authCookie(userId, username = 'testuser') {
    const token = jwt.sign({ id: userId, username }, process.env.JWT_SECRET);
    return `token=${token}`;
}

beforeEach(() => {
    jest.clearAllMocks();
});

// ============================================================
// E2E : Full Launch Feature Flow
// Simulates: Buy game → Configure launchPath → Launch game
// ============================================================

describe('E2E: Game Launch Feature', () => {

    const userId = 1;
    const cookie = authCookie(userId);

    // State shared across the flow
    const purchaseRecord = {
        id: 10,
        userId: 1,
        gameId: 121,
        status: 'to_play',
        source: 'mist_store',
        launchPath: null,
        platform: null,
        customTitle: null,
        save: jest.fn(),
    };

    test('Step 1: Buy Rocket League from the store', async () => {
        mockPurchase.findOne.mockResolvedValue(null); // not already owned
        mockPurchase.create.mockResolvedValue({ ...purchaseRecord });

        const res = await request(app)
            .post('/buy')
            .set('Cookie', cookie)
            .send({ gameId: 121 });

        expect(res.status).toBe(201);
        expect(res.body.gameId).toBe(121);
        expect(res.body.status).toBe('to_play');
    });

    test('Step 2: Verify the game appears in user library', async () => {
        mockPurchase.findAll.mockResolvedValue([{ ...purchaseRecord }]);

        const res = await request(app)
            .get('/user/1')
            .set('Cookie', cookie);

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].gameId).toBe(121);
    });

    test('Step 3: Try to launch without launchPath → should fail with 400', async () => {
        mockPurchase.findByPk.mockResolvedValue({ ...purchaseRecord, launchPath: null });

        const res = await request(app)
            .get('/purchase/10/launch')
            .set('Cookie', cookie);

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('No launch path');
        expect(res.body.hint).toBeDefined();
    });

    test('Step 4: Configure launchPath and platform', async () => {
        const saveable = { ...purchaseRecord, save: jest.fn() };
        mockPurchase.findByPk.mockResolvedValue(saveable);

        const res = await request(app)
            .patch('/purchase/10/details')
            .set('Cookie', cookie)
            .send({ launchPath: 'steam://run/252950', platform: 'Steam' });

        expect(res.status).toBe(200);
        expect(saveable.launchPath).toBe('steam://run/252950');
        expect(saveable.platform).toBe('Steam');
        expect(saveable.save).toHaveBeenCalled();
    });

    test('Step 5: Launch the game → should return launchUrl', async () => {
        mockPurchase.findByPk.mockResolvedValue({
            ...purchaseRecord,
            launchPath: 'steam://run/252950',
            platform: 'Steam',
            customTitle: 'Rocket League',
        });

        const res = await request(app)
            .get('/purchase/10/launch')
            .set('Cookie', cookie);

        expect(res.status).toBe(200);
        expect(res.body.launchUrl).toBe('steam://run/252950');
        expect(res.body.title).toBe('Rocket League');
        expect(res.body.platform).toBe('Steam');
    });

    test('Step 6: Change game status to playing', async () => {
        const saveable = { ...purchaseRecord, status: 'to_play', startedAt: null, save: jest.fn() };
        mockPurchase.findByPk.mockResolvedValue(saveable);

        const res = await request(app)
            .patch('/purchase/10/status')
            .set('Cookie', cookie)
            .send({ status: 'playing' });

        expect(res.status).toBe(200);
        expect(saveable.status).toBe('playing');
        expect(saveable.startedAt).toBeTruthy();
    });

    test('Step 7: Rate the game', async () => {
        const saveable = { ...purchaseRecord, rating: null, save: jest.fn() };
        mockPurchase.findByPk.mockResolvedValue(saveable);

        const res = await request(app)
            .patch('/purchase/10/rating')
            .set('Cookie', cookie)
            .send({ rating: 5 });

        expect(res.status).toBe(200);
        expect(saveable.rating).toBe(5);
    });
});

// ============================================================
// E2E : Error handling & Edge cases for Launch
// ============================================================

describe('E2E: Launch Feature Error Handling', () => {

    const cookie = authCookie(1);

    test('Cannot launch a game that does not exist', async () => {
        mockPurchase.findByPk.mockResolvedValue(null);

        const res = await request(app)
            .get('/purchase/999/launch')
            .set('Cookie', cookie);

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Purchase not found');
    });

    test('Cannot launch another users game', async () => {
        mockPurchase.findByPk.mockResolvedValue({
            id: 5, userId: 42, launchPath: 'steam://run/730'
        });

        const res = await request(app)
            .get('/purchase/5/launch')
            .set('Cookie', cookie);

        expect(res.status).toBe(403);
        expect(res.body.error).toBe('Access denied');
    });

    test('Cannot configure launchPath on another users game', async () => {
        mockPurchase.findByPk.mockResolvedValue({ id: 5, userId: 42 });

        const res = await request(app)
            .patch('/purchase/5/details')
            .set('Cookie', cookie)
            .send({ launchPath: 'steam://run/252950' });

        expect(res.status).toBe(403);
    });

    test('Cannot buy the same game twice', async () => {
        mockPurchase.findOne.mockResolvedValue({ id: 1 });

        const res = await request(app)
            .post('/buy')
            .set('Cookie', cookie)
            .send({ gameId: 121 });

        expect(res.status).toBe(409);
        expect(res.body.error).toBe('Game already in library');
    });

    test('Cannot launch without authentication', async () => {
        const res = await request(app)
            .get('/purchase/10/launch');

        expect(res.status).toBe(401);
    });

    test('Cannot configure details without authentication', async () => {
        const res = await request(app)
            .patch('/purchase/10/details')
            .send({ launchPath: 'steam://run/252950' });

        expect(res.status).toBe(401);
    });

    test('Can update launchPath without changing platform', async () => {
        const saveable = { id: 1, userId: 1, launchPath: 'old', platform: 'Epic', save: jest.fn() };
        mockPurchase.findByPk.mockResolvedValue(saveable);

        const res = await request(app)
            .patch('/purchase/1/details')
            .set('Cookie', authCookie(1))
            .send({ launchPath: 'steam://run/252950' });

        expect(res.status).toBe(200);
        expect(saveable.launchPath).toBe('steam://run/252950');
        expect(saveable.platform).toBe('Epic'); // unchanged
    });

    test('Can clear launchPath by setting empty string', async () => {
        const saveable = { id: 1, userId: 1, launchPath: 'steam://run/252950', save: jest.fn() };
        mockPurchase.findByPk.mockResolvedValue(saveable);

        const res = await request(app)
            .patch('/purchase/1/details')
            .set('Cookie', authCookie(1))
            .send({ launchPath: '' });

        expect(res.status).toBe(200);
        expect(saveable.launchPath).toBe('');
    });
});
