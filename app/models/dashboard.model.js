const ApplicationModel = require('./application.model');

class DashboardModel extends ApplicationModel {
    // Get dashboard statistics for admin
    static getAdminStats() {
        return this.query(
            `SELECT 
                (SELECT COUNT(*) FROM companies WHERE status = 'active') as total_companies,
                (SELECT COUNT(*) FROM users WHERE role = 'admin') as total_admins,
                (SELECT COUNT(*) FROM users WHERE role = 'hr') as total_hr,
                (SELECT COUNT(*) FROM users WHERE role = 'employee') as total_employees,
                (SELECT COUNT(*) FROM companies WHERE subscription_plan = 'premium') as premium_companies,
                (SELECT COUNT(*) FROM companies WHERE DATE(subscription_expiry) < CURDATE()) as expired_subscriptions
            `
        );
    }

    // Get dashboard statistics for HR
    static getHRStats(companyId) {
        return this.query(
            `SELECT 
                (SELECT COUNT(*) FROM users WHERE company_id = ? AND status = 'active') as total_employees,
                (SELECT COUNT(*) FROM attendance WHERE company_id = ? AND DATE(check_in) = CURDATE() AND status = 'present') as present_today,
                (SELECT COUNT(*) FROM leaves WHERE company_id = ? AND status = 'pending') as pending_leaves,
                (SELECT COUNT(*) FROM expenses WHERE company_id = ? AND status = 'pending') as pending_expenses,
                (SELECT COUNT(*) FROM salaries WHERE company_id = ? AND payment_status = 'pending') as pending_salaries,
                (SELECT SUM(amount) FROM expenses WHERE company_id = ? AND MONTH(expense_date) = MONTH(CURDATE()) AND status = 'approved') as monthly_expenses
            `,
            [companyId, companyId, companyId, companyId, companyId, companyId]
        );
    }

    // Get dashboard statistics for employee
    static getEmployeeStats(userId, companyId) {
        return this.query(
            `SELECT 
                (SELECT COUNT(*) FROM attendance WHERE user_id = ? AND MONTH(check_in) = MONTH(CURDATE())) as attendance_days,
                (SELECT COUNT(*) FROM leaves WHERE user_id = ? AND status = 'pending') as pending_leaves,
                (SELECT COUNT(*) FROM expenses WHERE user_id = ? AND status = 'pending') as pending_expenses,
                (SELECT COUNT(*) FROM salaries WHERE user_id = ? AND payment_status = 'pending') as pending_salaries,
                (SELECT SUM(total_days) FROM leaves WHERE user_id = ? AND YEAR(start_date) = YEAR(CURDATE()) AND status = 'approved') as used_leaves,
                (SELECT SUM(amount) FROM expenses WHERE user_id = ? AND MONTH(expense_date) = MONTH(CURDATE()) AND status = 'approved') as monthly_expenses
            `,
            [userId, userId, userId, userId, userId, userId]
        );
    }

    static async getRecentActivities(companyId, limit = 10) {
        try {
            let query;
            let params;

            if (companyId) {
                // Query with company filter
                query = `
                SELECT * FROM (
                    SELECT
                        'attendance' AS type,
                        CONCAT('Check-in by ', u.first_name) AS description,
                        a.check_in AS timestamp,
                        CONCAT(u.first_name, ' ', u.last_name) AS user_name
                    FROM attendance a
                    JOIN users u ON a.user_id = u.id
                
                    UNION ALL
                
                    SELECT
                        'leave' AS type,
                        CONCAT('Leave applied by ', u.first_name) AS description,
                        l.created_at AS timestamp,
                        CONCAT(u.first_name, ' ', u.last_name) AS user_name
                    FROM leaves l
                    JOIN users u ON l.user_id = u.id
                    WHERE l.status = 'pending'
                
                    UNION ALL
                
                    SELECT
                        'expense' AS type,
                        CONCAT('Expense submitted by ', u.first_name) AS description,
                        e.created_at AS timestamp,
                        CONCAT(u.first_name, ' ', u.last_name) AS user_name
                    FROM expenses e
                    JOIN users u ON e.user_id = u.id
                    WHERE e.status = 'pending'
                ) activities
                ORDER BY timestamp DESC
                LIMIT ?`;

                params = [companyId, limit, companyId, limit, companyId, limit, limit];
            } else {
                // Query without company filter (for admin)
                query = `
                SELECT * FROM (
                    (SELECT 
                        'attendance' as type,
                        CONCAT('Check-in by ', u.first_name) as description,
                        a.check_in as timestamp,
                        CONCAT(u.first_name, ' ', u.last_name) as user_name
                     FROM attendance a
                     JOIN users u ON a.user_id = u.id
                     ORDER BY a.check_in DESC
                     LIMIT ?)
                     
                     UNION ALL
                     
                     (SELECT 
                        'leave' as type,
                        CONCAT('Leave applied by ', u.first_name) as description,
                        l.created_at as timestamp,
                        CONCAT(u.first_name, ' ', u.last_name) as user_name
                     FROM leaves l
                     JOIN users u ON l.user_id = u.id
                     WHERE l.status = 'pending'
                     ORDER BY l.created_at DESC
                     LIMIT ?)
                     
                     UNION ALL
                     
                     (SELECT 
                        'expense' as type,
                        CONCAT('Expense submitted by ', u.first_name) as description,
                        e.created_at as timestamp,
                        CONCAT(u.first_name, ' ', u.last_name) as user_name
                     FROM expenses e
                     JOIN users u ON e.user_id = u.id
                     WHERE e.status = 'pending'
                     ORDER BY e.created_at DESC
                     LIMIT ?)
                ) as activities
                ORDER BY timestamp DESC
                LIMIT ?`;

                params = [limit, limit, limit, limit];
            }

            return await this.query(query, params);
        } catch (error) {
            console.error('Get recent activities error:', error);
            throw error;
        }
    }

    // Get monthly attendance chart data
    static getAttendanceChart(companyId, year, month) {
        return this.query(
            `SELECT 
                DATE(check_in) as date,
                COUNT(DISTINCT user_id) as present_count,
                (SELECT COUNT(*) FROM users WHERE company_id = ? AND status = 'active') as total_employees
             FROM attendance 
             WHERE company_id = ? 
             AND MONTH(check_in) = ? 
             AND YEAR(check_in) = ?
             GROUP BY DATE(check_in)
             ORDER BY date`,
            [companyId, companyId, month, year]
        );
    }

    // Get expense chart data
    static getExpenseChart(companyId, year) {
        return this.query(
            `SELECT 
                MONTH(expense_date) as month,
                SUM(amount) as total_expenses,
                expense_type
             FROM expenses 
             WHERE company_id = ? 
             AND YEAR(expense_date) = ?
             AND status = 'approved'
             GROUP BY MONTH(expense_date), expense_type
             ORDER BY month`,
            [companyId, year]
        );
    }
}

module.exports = DashboardModel;