// app/models/user.model.js
const ApplicationModel = require('./application.model');

class UserModel extends ApplicationModel {
    // Find user by email
    static findByEmail(email) {
        return this.query('SELECT * FROM users WHERE email = ?', [email]);
    }

    // Find user by ID
    static findById(id) {
        return this.query('SELECT * FROM users WHERE id = ?', [id]);
    }

    // Find all users by company
    static findByCompany(companyId) {
        return this.query('SELECT * FROM users WHERE company_id = ? ORDER BY id DESC', [companyId]);
    }

    // Find users by role
    static findByRole(companyId, role) {
        return this.query('SELECT * FROM users WHERE company_id = ? AND role = ? ORDER BY first_name', [companyId, role]);
    }

    // Create new user
    static create(userData) {
        const {
            company_id, first_name, last_name, email, password, phone,
            address, role, department_id, position, salary, bonus,
            hire_date, status, profile_image
        } = userData;

        return this.query(
            `INSERT INTO users 
            (company_id, first_name, last_name, email, password, phone, address, 
             role, department_id, position, salary, bonus, hire_date, status, profile_image) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                company_id, first_name, last_name, email, password, phone, address,
                role, department_id || null, position, salary || null, bonus || null, hire_date || null, status, profile_image || null
            ]
        );
    }

    // Update user
    static update(id, userData) {
        const fields = [];
        const values = [];

        Object.keys(userData).forEach(key => {
            if (userData[key] !== undefined) {
                fields.push(`${key} = ?`);
                values.push(userData[key]);
            }
        });

        values.push(id);

        return this.query(
            `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            values
        );
    }

    // Delete user (soft delete by changing status)
    static delete(id) {
        return this.query('UPDATE users SET status = "inactive", updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
    }

    // Get all active users
    static findAllActive(companyId) {
        return this.query(
            'SELECT * FROM users WHERE company_id = ? AND status = "active" ORDER BY first_name',
            [companyId]
        );
    }

    // Get user count by department
    static countByDepartment(companyId, departmentId) {
        return this.query(
            'SELECT COUNT(*) as count FROM users WHERE company_id = ? AND department_id = ? AND status = "active"',
            [companyId, departmentId]
        );
    }

    // Get user count by role
    static countByRole(companyId, role) {
        return this.query(
            'SELECT COUNT(*) as count FROM users WHERE company_id = ? AND role = ? AND status = "active"',
            [companyId, role]
        );
    }

    // Search users
    static search(companyId, searchTerm) {
        return this.query(
            `SELECT * FROM users 
             WHERE company_id = ? AND status = "active" 
             AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR position LIKE ?)
             ORDER BY first_name`,
            [companyId, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
        );
    }

    // Update user password
    static updatePassword(id, hashedPassword) {
        return this.query(
            'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [hashedPassword, id]
        );
    }

    // Update user profile
    static updateProfile(id, profileData) {
        return this.query(
            'UPDATE users SET first_name = ?, last_name = ?, phone = ?, address = ?, profile_image = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [
                profileData.first_name,
                profileData.last_name,
                profileData.phone,
                profileData.address,
                profileData.profile_image,
                id
            ]
        );
    }
}

module.exports = UserModel;