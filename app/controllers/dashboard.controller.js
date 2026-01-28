//app/controllers/dashboard.controller.js
const DashboardService = require('../services/dashboard.service');
const ApplicationController = require('./application.controller');

class DashboardController extends ApplicationController {
    constructor() {
        super(DashboardService);
        this.bindMethods();
    }

    bindMethods() {
        const methods = [
            'getAdminDashboard', 'getHRDashboard', 'getEmployeeDashboard', 'updateProfile',
            'getAnalytics', 'getDashboardStats', 'getRecentActivities', 'getNotifications',
            'getRecentCompanies', 'getRecentEmployees', 'getUpcomingTasks'
        ];

        methods.forEach(method => {
            if (this[method]) {
                this[method] = this[method].bind(this);
            }
        });
    }

    // Get admin dashboard
    async getAdminDashboard(req, res) {
        try {
            const result = await this.service.getAdminDashboard();

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            // For web requests
            if (!req.xhr && !req.headers.accept?.includes('application/json')) {
                return res.render('dashboard/admin', {
                    title: 'Admin Dashboard',
                    subtitle: 'System Overview & Management',
                    css: 'dashboard',
                    stats: result.data.stats,
                    activities: result.data.activities,
                    subscription_breakdown: result.data.subscription_breakdown,
                    recentCompanies: await this.getRecentCompanies(),

                });
            }

            return this.success(res, result.data, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Get HR dashboard
    async getHRDashboard(req, res) {
        try {
            const companyId = req.user.companyId;

            const result = await this.service.getHRDashboard(companyId);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            // For web requests
            if (!req.xhr && !req.headers.accept?.includes('application/json')) {
                return res.render('dashboard/hr', {
                    title: 'HR Dashboard',
                    stats: result.data.stats,
                    activities: result.data.activities,
                    charts: result.data.charts,
                    pending_items: result.data.pending_items,
                    recentEmployees: await this.getRecentEmployees(companyId),
                    upcomingTasks: await this.getUpcomingTasks(companyId)
                });
            }

            return this.success(res, result.data, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Get employee dashboard
    async getEmployeeDashboard(req, res) {
        try {
            const userId = req.user.id;
            const companyId = req.user.companyId;

            const result = await this.service.getEmployeeDashboard(userId, companyId);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            // For web requests
            if (!req.xhr && !req.headers.accept?.includes('application/json')) {
                return res.render('dashboard/employee', {
                    title: 'Employee Dashboard',
                    stats: result.data.stats,
                    recent_attendance: result.data.recent_attendance,
                    upcoming_leaves: result.data.upcoming_leaves,
                    recent_expenses: result.data.recent_expenses,
                    salary_summary: result.data.salary_summary
                });
            }

            return this.success(res, result.data, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Get analytics
    async getAnalytics(req, res) {
        try {
            const companyId = req.user.companyId;
            const period = req.query.period || 'month';

            const result = await this.service.getAnalytics(companyId, period);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            // For web requests
            if (!req.xhr && !req.headers.accept?.includes('application/json')) {
                return res.render('dashboard/analytics', {
                    title: 'Analytics Dashboard',
                    analytics: result.data,
                    period: period
                });
            }

            return this.success(res, result.data, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Get dashboard statistics
    async getDashboardStats(req, res) {
        
        try {
            const companyId = req.user.companyId;

            let result;
            if (req.user.role === 'admin') {
                result = await this.service.getAdminStats();
            } else if (req.user.role === 'hr') {
                result = await this.service.getHRStats(companyId);
            } else {
                result = await this.service.getEmployeeStats(req.user.id, companyId);
            }

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            return this.success(res, result.data, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Get recent activities  
    async getRecentActivities(req, res) {
        try {
            const companyId = req.user.companyId;
            const limit = req.query.limit || 10;

            const result = await this.service.getRecentActivities(companyId, limit);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            return this.success(res, result.data, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Get 
    async getNotifications(req, res) {
        try {
            const userId = req.user.id;

            // This would typically come from a notifications service
            const notifications = [
                {
                    id: 1,
                    type: 'leave',
                    title: 'Leave Approved',
                    message: 'Your leave request has been approved',
                    read: false,
                    created_at: new Date(Date.now() - 3600000)
                },
                {
                    id: 2,
                    type: 'attendance',
                    title: 'Late Check-in',
                    message: 'You checked in late today',
                    read: false,
                    created_at: new Date(Date.now() - 86400000)
                },
                {
                    id: 3,
                    type: 'salary',
                    title: 'Salary Processed',
                    message: 'Salary for March has been processed',
                    read: true,
                    created_at: new Date(Date.now() - 259200000)
                }
            ];

            const unreadCount = notifications.filter(n => !n.read).length;

            return this.success(res, {
                notifications,
                unread_count: unreadCount,
                total: notifications.length
            }, 'Notifications retrieved');

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Mark notification as read notifications 
    async markNotificationRead(req, res) {
        try {
            const notificationId = req.params.notificationId;

            // This would typically update in database
            // For now, just return success

            return this.success(res, { id: notificationId }, 'Notification marked as read');

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Helper methods
    async getRecentCompanies() {
        const result = await this.service.getRecentCompanies();
        if (!result.success) {
            return [];
        }
        // This would typically come from database
        return result.data;
    }

    async getRecentEmployees(companyId) {
        // This would typically come from database
        return [
            {
                id: 101,
                first_name: 'John',
                last_name: 'Doe',
                email: 'john@example.com',
                department_name: 'IT',
                position: 'Software Developer',
                status: 'active',
                hire_date: new Date(),
                profile_image: null
            },
            {
                id: 102,
                first_name: 'Jane',
                last_name: 'Smith',
                email: 'jane@example.com',
                department_name: 'HR',
                position: 'HR Manager',
                status: 'active',
                hire_date: new Date(Date.now() - 86400000),
                profile_image: null
            }
        ];
    }

    async getUpcomingTasks(companyId) {
        // This would typically come from database
        return [
            {
                id: 1,
                title: 'Process monthly salaries',
                priority: 'high',
                due_date: new Date(Date.now() + 86400000),
                completed: false
            },
            {
                id: 2,
                title: 'Review pending leaves',
                priority: 'medium',
                due_date: new Date(Date.now() + 172800000),
                completed: false
            },
            {
                id: 3,
                title: 'Update employee handbook',
                priority: 'low',
                due_date: new Date(Date.now() + 604800000),
                completed: true
            }
        ];
    }
}

module.exports = new DashboardController();