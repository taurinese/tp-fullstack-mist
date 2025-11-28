// Fonction de validation simple
function validateAuthData(username, email, password, isRegistering = false) {
    const errors = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Regex basique

    if (isRegistering && (!username || username.length < 3)) {
        errors.push("Username must be at least 3 characters long.");
    }

    if (!email || !emailRegex.test(email)) {
        errors.push("Invalid email format.");
    }

    if (!password || password.length < 6) {
        errors.push("Password must be at least 6 characters long.");
    }

    return errors;
}

module.exports = { validateAuthData };
