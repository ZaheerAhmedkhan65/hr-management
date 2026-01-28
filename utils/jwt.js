const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
}

module.exports = {
    sign(payload, options = {}) {
        return jwt.sign(payload, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN,
            ...options,
        });
    },

    verify(token) {
        return jwt.verify(token, JWT_SECRET);
    },
};
