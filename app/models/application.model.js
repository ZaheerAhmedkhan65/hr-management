// app/models/application.model.js
const db = require('../../config/db');

class ApplicationModel {
    static async query(sql, params = []) {
        try {
            const [rows] = await db.execute(sql, params);
            return rows;
        } catch (error) {
            console.error('Query error:', { sql, params, error: error.message });
            throw error;
        }
    }
}

module.exports = ApplicationModel;