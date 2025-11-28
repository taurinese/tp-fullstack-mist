const { validateAuthData } = require('../utils/validation');

describe('Auth Validation Logic', () => {
    
    test('should validate correct login data', () => {
        const errors = validateAuthData(null, 'test@example.com', 'password123', false);
        expect(errors).toHaveLength(0);
    });

    test('should validate correct register data', () => {
        const errors = validateAuthData('testuser', 'test@example.com', 'password123', true);
        expect(errors).toHaveLength(0);
    });

    test('should fail on invalid email', () => {
        const errors = validateAuthData(null, 'invalid-email', 'password123', false);
        expect(errors).toContain('Invalid email format.');
    });

    test('should fail on short password', () => {
        const errors = validateAuthData(null, 'test@example.com', '123', false);
        expect(errors).toContain('Password must be at least 6 characters long.');
    });

    test('should fail on short username during register', () => {
        const errors = validateAuthData('yo', 'test@example.com', 'password123', true);
        expect(errors).toContain('Username must be at least 3 characters long.');
    });

    test('should allow short username during login (ignored)', () => {
        // Username is not checked during login
        const errors = validateAuthData('yo', 'test@example.com', 'password123', false);
        expect(errors).toHaveLength(0);
    });
});
