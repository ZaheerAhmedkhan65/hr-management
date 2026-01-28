// app/models/leave.model.js
const ApplicationModel = require('./application.model');

class LeaveModel extends ApplicationModel {
    // Create leave application
    static create(leaveData) {
        const { user_id, company_id, leave_type, start_date, end_date, total_days, reason } = leaveData;

        return this.query(
            `INSERT INTO leaves 
            (user_id, company_id, leave_type, start_date, end_date, total_days, reason) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [user_id, company_id, leave_type, start_date, end_date, total_days, reason]
        );
    }

    // Get leave by ID
    static findById(id) {
        return this.query(
            `SELECT l.*, 
                    CONCAT(u.first_name, ' ', u.last_name) as employee_name,
                    u.position,
                    d.department_name
             FROM leaves l
             JOIN users u ON l.user_id = u.id
             LEFT JOIN departments d ON u.department_id = d.id
             WHERE l.id = ?`,
            [id]
        );
    }

    // Get leaves by user
    static getByUser(userId) {
        return this.query(
            `SELECT l.*, 
                    CONCAT(a.first_name, ' ', a.last_name) as approved_by_name
             FROM leaves l
             LEFT JOIN users a ON l.approved_by = a.id
             WHERE l.user_id = ?
             ORDER BY l.start_date DESC`,
            [userId]
        );
    }

    // Get pending leaves by company
    static getPendingByCompany(companyId) {
        return this.query(
            `SELECT l.*, 
                    CONCAT(u.first_name, ' ', u.last_name) as employee_name,
                    u.position,
                    d.department_name
             FROM leaves l
             JOIN users u ON l.user_id = u.id
             LEFT JOIN departments d ON u.department_id = d.id
             WHERE l.company_id = ? AND l.status = 'pending'
             ORDER BY l.created_at DESC`,
            [companyId]
        );
    }

    // Update leave status
    static updateStatus(id, status, approvedBy = null, notes = null) {
        return this.query(
            `UPDATE leaves 
             SET status = ?, approved_by = ?, approved_date = CURDATE() 
             WHERE id = ?`,
            [status, approvedBy, id]
        );
    }

    // Get leave summary for user
    static getLeaveSummary(userId, year) {
        return this.query(
            `SELECT 
                leave_type,
                COUNT(*) as total_applications,
                SUM(CASE WHEN status = 'approved' THEN total_days ELSE 0 END) as approved_days,
                SUM(CASE WHEN status = 'pending' THEN total_days ELSE 0 END) as pending_days,
                SUM(CASE WHEN status = 'rejected' THEN total_days ELSE 0 END) as rejected_days
             FROM leaves 
             WHERE user_id = ? AND YEAR(start_date) = ?
             GROUP BY leave_type`,
            [userId, year]
        );
    }

    // Check for overlapping leaves
    static checkOverlap(userId, startDate, endDate, excludeId = null) {
        let sql = `SELECT COUNT(*) as count 
                   FROM leaves 
                   WHERE user_id = ? 
                   AND status IN ('pending', 'approved')
                   AND ((start_date BETWEEN ? AND ?) 
                        OR (end_date BETWEEN ? AND ?) 
                        OR (start_date <= ? AND end_date >= ?))`;

        const params = [userId, startDate, endDate, startDate, endDate, startDate, endDate];

        if (excludeId) {
            sql += ' AND id != ?';
            params.push(excludeId);
        }

        return this.query(sql, params);
    }

    // Get leaves by date range
    static getByDateRange(companyId, startDate, endDate) {
        return this.query(
            `SELECT l.*, 
                    CONCAT(u.first_name, ' ', u.last_name) as employee_name,
                    u.position,
                    d.department_name,
                    CONCAT(a.first_name, ' ', a.last_name) as approved_by_name
             FROM leaves l
             JOIN users u ON l.user_id = u.id
             LEFT JOIN departments d ON u.department_id = d.id
             LEFT JOIN users a ON l.approved_by = a.id
             WHERE l.company_id = ? 
             AND ((l.start_date BETWEEN ? AND ?) OR (l.end_date BETWEEN ? AND ?))
             ORDER BY l.start_date`,
            [companyId, startDate, endDate, startDate, endDate]
        );
    }
}

module.exports = LeaveModel;