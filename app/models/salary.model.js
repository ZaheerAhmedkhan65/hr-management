// app/models/salary.model.js
const ApplicationModel = require('./application.model');

class SalaryModel extends ApplicationModel {
    // Create salary record
    static create(salaryData) {
        const { user_id, company_id, month, basic_salary, bonus, deductions, total_amount, notes } = salaryData;

        return this.query(
            `INSERT INTO salaries 
            (user_id, company_id, month, basic_salary, bonus, deductions, total_amount, notes) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [user_id, company_id, month, basic_salary, bonus, deductions, total_amount, notes]
        );
    }

    // Get salary by ID
    static findById(id) {
        return this.query(
            `SELECT s.*, 
                    CONCAT(u.first_name, ' ', u.last_name) as employee_name,
                    u.position,
                    d.department_name
             FROM salaries s
             JOIN users u ON s.user_id = u.id
             LEFT JOIN departments d ON u.department_id = d.id
             WHERE s.id = ?`,
            [id]
        );
    }

    // Get salaries by user
    static getByUser(userId) {
        return this.query(
            `SELECT s.* 
             FROM salaries s
             WHERE s.user_id = ?
             ORDER BY s.month DESC`,
            [userId]
        );
    }

    // Get salaries by company and month
    static getByCompanyAndMonth(companyId, month) {
        return this.query(
            `SELECT s.*, 
                    CONCAT(u.first_name, ' ', u.last_name) as employee_name,
                    u.position,
                    d.department_name
             FROM salaries s
             JOIN users u ON s.user_id = u.id
             LEFT JOIN departments d ON u.department_id = d.id
             WHERE s.company_id = ? AND s.month = ?
             ORDER BY u.first_name`,
            [companyId, month]
        );
    }

    // Update salary status
    static updateStatus(id, status, paymentDate = null) {
        return this.query(
            'UPDATE salaries SET payment_status = ?, payment_date = ? WHERE id = ?',
            [status, paymentDate, id]
        );
    }

    // Update salary details
    static update(id, salaryData) {
        const fields = [];
        const values = [];

        Object.keys(salaryData).forEach(key => {
            if (salaryData[key] !== undefined) {
                fields.push(`${key} = ?`);
                values.push(salaryData[key]);
            }
        });

        values.push(id);

        return this.query(
            `UPDATE salaries SET ${fields.join(', ')} WHERE id = ?`,
            values
        );
    }

    // Get salary summary for company
    static getSalarySummary(companyId, year) {
        return this.query(
            `SELECT 
                DATE_FORMAT(STR_TO_DATE(CONCAT(month, '01'), '%Y%m%d'), '%Y-%m') as salary_month,
                COUNT(*) as employee_count,
                SUM(basic_salary) as total_basic,
                SUM(bonus) as total_bonus,
                SUM(deductions) as total_deductions,
                SUM(total_amount) as total_payable,
                SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as total_paid
             FROM salaries 
             WHERE company_id = ? 
             AND LEFT(month, 4) = ?
             GROUP BY month
             ORDER BY month DESC`,
            [companyId, year]
        );
    }

    // Check if salary exists for user and month
    static exists(userId, month) {
        return this.query(
            'SELECT COUNT(*) as count FROM salaries WHERE user_id = ? AND month = ?',
            [userId, month]
        );
    }

    // Get pending salaries
    static getPendingSalaries(companyId) {
        return this.query(
            `SELECT s.*, 
                    CONCAT(u.first_name, ' ', u.last_name) as employee_name,
                    u.position,
                    d.department_name
             FROM salaries s
             JOIN users u ON s.user_id = u.id
             LEFT JOIN departments d ON u.department_id = d.id
             WHERE s.company_id = ? AND s.payment_status = 'pending'
             ORDER BY s.month DESC`,
            [companyId]
        );
    }
}

module.exports = SalaryModel;