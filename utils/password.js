const bcrypt = require("bcryptjs");

const SALT_ROUNDS = 10;

module.exports = {
    async hash(password) {
        return bcrypt.hash(password, SALT_ROUNDS);
    },

    async compare(password, hashedPassword) {
        return bcrypt.compare(password, hashedPassword);
    },
};
