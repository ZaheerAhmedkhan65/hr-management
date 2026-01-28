// app/models/expense.model.js
const ApplicationModel = require('./application.model');

class ExpenseModel extends ApplicationModel {
    // Create expense
    static create(expenseData) {
        const { company_id, user_id, expense_type, description, amount, receipt_image, expense_date } = expenseData;

        return this.query(
            `INSERT INTO expenses 
            (company_id, user_id, expense_type, description, amount, receipt_image, expense_date) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [company_id, user_id, expense_type, description, amount, receipt_image, expense_date]
        );
    }

    // Get expense by ID
    static findById(id) {
        return this.query(
            `SELECT e.*, 
                    CONCAT(u.first_name, ' ', u.last_name) as employee_name,
                    u.position,
                    d.department_name,
                    CONCAT(a.first_name, ' ', a.last_name) as approved_by_name
             FROM expenses e
             JOIN users u ON e.user_id = u.id
             LEFT JOIN departments d ON u.department_id = d.id
             LEFT JOIN users a ON e.approved_by = a.id
             WHERE e.id = ?`,
            [id]
        );
    }

    // Get expenses by user
    static getByUser(userId) {
        return this.query(
            `SELECT e.*, 
                    CONCAT(a.first_name, ' ', a.last_name) as approved_by_name
             FROM expenses e
             LEFT JOIN users a ON e.approved_by = a.id
             WHERE e.user_id = ?
             ORDER BY e.expense_date DESC`,
            [userId]
        );
    }

    // Get pending expenses by company
    static getPendingByCompany(companyId) {
        return this.query(
            `SELECT e.*, 
                    CONCAT(u.first_name, ' ', u.last_name) as employee_name,
                    u.position,
                    d.department_name
             FROM expenses e
             JOIN users u ON e.user_id = u.id
             LEFT JOIN departments d ON u.department_id = d.id
             WHERE e.company_id = ? AND e.status = 'pending'
             ORDER BY e.created_at DESC`,
            [companyId]
        );
    }

    // Update expense status
    static updateStatus(id, status, approvedBy = null) {
        return this.query(
            'UPDATE expenses SET status = ?, approved_by = ? WHERE id = ?',
            [status, approvedBy, id]
        );
    }

    // Get expense summary
    static getSummary(companyId, startDate, endDate) {
        return this.query(
            `SELECT 
                expense_type,
                COUNT(*) as count,
                SUM(amount) as total_amount,
                SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END) as approved_amount,
                SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount,
                SUM(CASE WHEN status = 'rejected' THEN amount ELSE 0 END) as rejected_amount
             FROM expenses 
             WHERE company_id = ? 
             AND expense_date BETWEEN ? AND ?
             GROUP BY expense_type`,
            [companyId, startDate, endDate]
        );
    }

    // Get expenses by date range
    static getByDateRange(companyId, startDate, endDate) {
        return this.query(
            `SELECT e.*, 
                    CONCAT(u.first_name, ' ', u.last_name) as employee_name,
                    u.position,
                    d.department_name,
                    CONCAT(a.first_name, ' ', a.last_name) as approved_by_name
             FROM expenses e
             JOIN users u ON e.user_id = u.id
             LEFT JOIN departments d ON u.department_id = d.id
             LEFT JOIN users a ON e.approved_by = a.id
             WHERE e.company_id = ? 
             AND e.expense_date BETWEEN ? AND ?
             ORDER BY e.expense_date DESC`,
            [companyId, startDate, endDate]
        );
    }

    // Get monthly expense report
    static getMonthlyReport(companyId, month, year) {
        return this.query(
            `SELECT 
                DATE_FORMAT(e.expense_date, '%Y-%m-%d') as date,
                COUNT(*) as count,
                SUM(e.amount) as daily_total,
                e.expense_type
             FROM expenses e
             WHERE e.company_id = ? 
             AND MONTH(e.expense_date) = ? 
             AND YEAR(e.expense_date) = ?
             AND e.status = 'approved'
             GROUP BY e.expense_date, e.expense_type
             ORDER BY e.expense_date`,
            [companyId, month, year]
        );
    }
}

module.exports = ExpenseModel;