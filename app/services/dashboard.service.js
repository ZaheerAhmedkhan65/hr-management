//app/services/dashboard.service.js
const DashboardModel = require('../models/dashboard.model');
const AttendanceService = require('./attendance.service');
const LeaveService = require('./leave.service');
const ExpenseService = require('./expense.service');
const SalaryService = require('./salary.service');
const UserService = require('./user.service');
const moment = require('moment');
const ApplicationService = require('./application.service');

class DashboardService extends ApplicationService {
    async getAdminDashboard() {
        try {
            const [stats] = await DashboardModel.getAdminStats();

            // Get recent activities
            const activities = [] // await DashboardModel.getRecentActivities(null, 10);

            // Get companies by subscription
            const companiesByPlan = {
                free: await DashboardModel.query(
                    'SELECT COUNT(*) as count FROM companies WHERE subscription_plan = "free" AND status = "active"'
                ),
                basic: await DashboardModel.query(
                    'SELECT COUNT(*) as count FROM companies WHERE subscription_plan = "basic" AND status = "active"'
                ),
                premium: await DashboardModel.query(
                    'SELECT COUNT(*) as count FROM companies WHERE subscription_plan = "premium" AND status = "active"'
                )
            };

            return this.success({
                stats,
                activities,
                subscription_breakdown: {
                    free: companiesByPlan.free[0].count,
                    basic: companiesByPlan.basic[0].count,
                    premium: companiesByPlan.premium[0].count
                },
                timestamp: new Date()
            }, 'Admin dashboard data retrieved');
        } catch (error) {
            console.error('Get admin dashboard error:', error);
            return this.error('Failed to load admin dashboard');
        }
    }

    async getHRDashboard(companyId) {
        try {
            const [stats] = await DashboardModel.getHRStats(companyId);

            // Get recent activities for company
            const activities = await DashboardModel.getRecentActivities(companyId, 10);

            // Get attendance chart data for current month
            const currentMonth = moment().month() + 1;
            const currentYear = moment().year();
            const attendanceChart = await DashboardModel.getAttendanceChart(companyId, currentYear, currentMonth);

            // Get expense chart data for current year
            const expenseChart = await DashboardModel.getExpenseChart(companyId, currentYear);

            // Get pending items count
            const [pendingLeaves] = await DashboardModel.query(
                'SELECT COUNT(*) as count FROM leaves WHERE company_id = ? AND status = "pending"',
                [companyId]
            );

            const [pendingExpenses] = await DashboardModel.query(
                'SELECT COUNT(*) as count FROM expenses WHERE company_id = ? AND status = "pending"',
                [companyId]
            );

            return this.success({
                stats,
                activities,
                charts: {
                    attendance: attendanceChart,
                    expenses: expenseChart
                },
                pending_items: {
                    leaves: pendingLeaves.count,
                    expenses: pendingExpenses.count
                },
                timestamp: new Date()
            }, 'HR dashboard data retrieved');
        } catch (error) {
            console.error('Get HR dashboard error:', error);
            return this.error('Failed to load HR dashboard');
        }
    }

    async getEmployeeDashboard(userId, companyId) {
        try {
            const [stats] = await DashboardModel.getEmployeeStats(userId, companyId);

            // Get recent attendance (last 5 days)
            const recentAttendance = await DashboardModel.query(
                `SELECT DATE(check_in) as date, status, total_hours 
                 FROM attendance 
                 WHERE user_id = ? 
                 ORDER BY check_in DESC 
                 LIMIT 5`,
                [userId]
            );

            // Get upcoming leaves
            const upcomingLeaves = await DashboardModel.query(
                `SELECT * FROM leaves 
                 WHERE user_id = ? 
                 AND start_date >= CURDATE() 
                 AND status = 'approved'
                 ORDER BY start_date 
                 LIMIT 5`,
                [userId]
            );

            // Get recent expenses
            const recentExpenses = await DashboardModel.query(
                `SELECT * FROM expenses 
                 WHERE user_id = ? 
                 ORDER BY expense_date DESC 
                 LIMIT 5`,
                [userId]
            );

            // Get salary summary
            const salarySummary = await DashboardModel.query(
                `SELECT 
                    COUNT(*) as total_months,
                    SUM(total_amount) as total_earned,
                    AVG(total_amount) as average_salary
                 FROM salaries 
                 WHERE user_id = ? AND payment_status = 'paid'`,
                [userId]
            );

            return this.success({
                stats,
                recent_attendance: recentAttendance,
                upcoming_leaves: upcomingLeaves,
                recent_expenses: recentExpenses,
                salary_summary: salarySummary[0] || {},
                timestamp: new Date()
            }, 'Employee dashboard data retrieved');
        } catch (error) {
            console.error('Get employee dashboard error:', error);
            return this.error('Failed to load employee dashboard');
        }
    }

    async getAnalytics(companyId, period = 'month') {
        try {
            let startDate, endDate;

            switch (period) {
                case 'week':
                    startDate = moment().startOf('week').format('YYYY-MM-DD');
                    endDate = moment().endOf('week').format('YYYY-MM-DD');
                    break;
                case 'month':
                    startDate = moment().startOf('month').format('YYYY-MM-DD');
                    endDate = moment().endOf('month').format('YYYY-MM-DD');
                    break;
                case 'quarter':
                    startDate = moment().startOf('quarter').format('YYYY-MM-DD');
                    endDate = moment().endOf('quarter').format('YYYY-MM-DD');
                    break;
                case 'year':
                    startDate = moment().startOf('year').format('YYYY-MM-DD');
                    endDate = moment().endOf('year').format('YYYY-MM-DD');
                    break;
                default:
                    startDate = moment().startOf('month').format('YYYY-MM-DD');
                    endDate = moment().endOf('month').format('YYYY-MM-DD');
            }

            // Get attendance analytics
            const attendanceAnalytics = await DashboardModel.query(
                `SELECT 
                    DATE(check_in) as date,
                    COUNT(DISTINCT user_id) as present_count,
                    (SELECT COUNT(*) FROM users WHERE company_id = ? AND status = 'active') as total_employees,
                    ROUND((COUNT(DISTINCT user_id) * 100.0 / 
                          (SELECT COUNT(*) FROM users WHERE company_id = ? AND status = 'active')), 2) as attendance_rate
                 FROM attendance 
                 WHERE company_id = ? 
                 AND DATE(check_in) BETWEEN ? AND ?
                 GROUP BY DATE(check_in)
                 ORDER BY date`,
                [companyId, companyId, companyId, startDate, endDate]
            );

            // Get expense analytics
            const expenseAnalytics = await DashboardModel.query(
                `SELECT 
                    expense_type,
                    COUNT(*) as count,
                    SUM(amount) as total_amount,
                    ROUND(AVG(amount), 2) as average_amount
                 FROM expenses 
                 WHERE company_id = ? 
                 AND expense_date BETWEEN ? AND ?
                 AND status = 'approved'
                 GROUP BY expense_type
                 ORDER BY total_amount DESC`,
                [companyId, startDate, endDate]
            );

            // Get leave analytics
            const leaveAnalytics = await DashboardModel.query(
                `SELECT 
                    leave_type,
                    COUNT(*) as total_applications,
                    SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
                    SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
                 FROM leaves 
                 WHERE company_id = ? 
                 AND start_date BETWEEN ? AND ?
                 GROUP BY leave_type`,
                [companyId, startDate, endDate]
            );

            // Get department-wise statistics
            const departmentStats = await DashboardModel.query(
                `SELECT 
                    d.department_name,
                    COUNT(u.id) as employee_count,
                    AVG(u.salary) as avg_salary,
                    SUM(u.salary) as total_salary
                 FROM departments d
                 LEFT JOIN users u ON d.id = u.department_id AND u.status = 'active'
                 WHERE d.company_id = ?
                 GROUP BY d.id, d.department_name
                 ORDER BY employee_count DESC`,
                [companyId]
            );

            return this.success({
                period,
                date_range: { start_date: startDate, end_date: endDate },
                attendance: attendanceAnalytics,
                expenses: expenseAnalytics,
                leaves: leaveAnalytics,
                departments: departmentStats,
                summary: {
                    total_attendance_days: attendanceAnalytics.reduce((sum, a) => sum + a.present_count, 0),
                    total_expenses: expenseAnalytics.reduce((sum, e) => sum + parseFloat(e.total_amount), 0),
                    total_leaves: leaveAnalytics.reduce((sum, l) => sum + l.total_applications, 0)
                }
            }, 'Analytics data retrieved');
        } catch (error) {
            console.error('Get analytics error:', error);
            return this.error('Failed to load analytics');
        }
    }

    async getRecentCompanies() {
        try {
            const companies = await DashboardModel.query(
                'SELECT id, company_name, subscription_plan, status, created_at FROM companies ORDER BY created_at DESC LIMIT 5'
            );
            return this.success(companies, 'Recent companies retrieved');
        } catch (error) {
            console.error('Get recent companies error:', error);
            return this.error('Failed to retrieve recent companies');
        }
    }
}

module.exports = new DashboardService();