//app/controllers/company.controller.js
const CompanyService = require('../services/company.service');
const ApplicationController = require('./application.controller');

class CompanyController extends ApplicationController {
    constructor() {
        super(CompanyService);
    }

    // Get all companies (admin only)
    async getAllCompanies(req, res) {
        try {
            const { page, limit, offset } = this.paginate(req);
            const filters = {
                status: req.query.status,
                plan: req.query.plan,
                search: req.query.search
            };

            const result = await this.service.getAllCompanies({
                ...filters,
                page,
                limit,
                offset
            });

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            // For web requests
            if (!req.xhr && !req.headers.accept?.includes('application/json')) {
                return res.render('companies/list', {
                    title: 'Companies',
                    companies: result.data.companies,
                    currentPage: page,
                    totalPages: result.data.pages,
                    query: req.query
                });
            }

            return this.success(res, result.data, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Get single company
    async getCompany(req, res) {
        try {
            const companyId = req.params.companyId;

            const result = await this.service.getCompany(companyId);

            if (!result.success) {
                return this.error(res, result.message, 404);
            }

            // Check permission
            if (!this.hasCompanyAccess(req.user, companyId)) {
                return this.error(res, 'Access denied', 403);
            }

            // For web requests
            if (!req.xhr && !req.headers.accept?.includes('application/json')) {
                return res.render('companies/view', {
                    title: 'Company Details',
                    company: result.data
                });
            }

            return this.success(res, result.data, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Create company (admin only)
    async createCompany(req, res) {
        try {
            const companyData = req.body;

            const result = await this.service.createCompany(companyData, req.user.id);

            if (!result.success) {
                // For web requests
                if (!req.xhr && !req.headers.accept?.includes('application/json')) {
                    req.flash('error_msg', result.message);
                    req.flash('old_input', req.body);
                    return res.redirect('/companies/create');
                }
                return this.error(res, result.message, 400);
            }

            if (!req.xhr && !req.headers.accept?.includes('application/json')) {
                req.flash('success_msg', result.message);
                return res.redirect(`/companies/view/${result.data.id}`);
            }

            return this.success(res, result.data, result.message, 201);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Update company (admin only)
    async updateCompany(req, res) {
        try {
            const companyId = req.params.companyId;
            const companyData = req.body;

            const result = await this.service.updateCompany(companyId, companyData, req.user.id);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            if (!req.xhr && !req.headers.accept?.includes('application/json')) {
                req.flash('success_msg', result.message);
                return res.redirect(`/companies/view/${companyId}`);
            }

            return this.success(res, result.data, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Delete company (admin only)
    async deleteCompany(req, res) {
        try {
            const companyId = req.params.companyId;

            const result = await this.service.deleteCompany(companyId, req.user.id);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            if (!req.xhr && !req.headers.accept?.includes('application/json')) {
                req.flash('success_msg', result.message);
                return res.redirect('/companies/list');
            }

            return this.success(res, null, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Update company status (admin only)
    async updateCompanyStatus(req, res) {
        try {
            const companyId = req.params.companyId;
            const { status } = req.body;

            const result = await this.service.updateCompanyStatus(companyId, status, req.user.id);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            return this.success(res, result.data, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Update company subscription (admin only)
    async updateSubscription(req, res) {
        try {
            const companyId = req.params.companyId;
            const subscriptionData = req.body;

            const result = await this.service.updateSubscription(companyId, subscriptionData, req.user.id);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            return this.success(res, result.data, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Get company dashboard
    async getCompanyDashboard(req, res) {
        try {
            const companyId = req.params.companyId || req.user.companyId;

            // Check permission
            if (!this.hasCompanyAccess(req.user, companyId)) {
                return this.error(res, 'Access denied', 403);
            }

            // Get company stats, recent activities, etc.
            const stats = await this.getCompanyStatsData(companyId);
            const recentActivities = await this.getRecentActivities(companyId);
            const upcomingEvents = await this.getUpcomingEvents(companyId);

            // For web requests
            if (!req.xhr && !req.headers.accept?.includes('application/json')) {
                return res.render('companies/dashboard', {
                    title: 'Company Dashboard',
                    stats,
                    recentActivities,
                    upcomingEvents,
                    companyId
                });
            }

            return this.success(res, {
                stats,
                recentActivities,
                upcomingEvents
            }, 'Company dashboard data retrieved');

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Get company reports
    async getCompanyReports(req, res) {
        try {
            const companyId = req.params.companyId || req.user.companyId;

            // Check permission
            if (!this.hasCompanyAccess(req.user, companyId)) {
                return this.error(res, 'Access denied', 403);
            }

            const reports = await this.generateCompanyReports(companyId);

            // For web requests
            if (!req.xhr && !req.headers.accept?.includes('application/json')) {
                return res.render('companies/reports', {
                    title: 'Company Reports',
                    reports,
                    companyId
                });
            }

            return this.success(res, reports, 'Company reports retrieved');

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Get company statistics
    async getCompanyStats(req, res) {
        try {
            const result = await this.service.getCompanyStats();

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            return this.success(res, result.data, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Helper methods
    hasCompanyAccess(currentUser, companyId) {
        if (currentUser.role === 'admin') return true;
        if (currentUser.companyId === parseInt(companyId)) return true;
        return false;
    }

    async getCompanyStatsData(companyId) {
        // This would typically come from a statistics service
        return {
            total_employees: 150,
            active_employees: 145,
            departments: 8,
            avg_attendance: '92%',
            pending_leaves: 12,
            pending_expenses: 8
        };
    }

    async getRecentActivities(companyId) {
        // This would typically come from an activities service
        return [
            {
                id: 1,
                type: 'user',
                action: 'created',
                description: 'New employee joined',
                timestamp: new Date(Date.now() - 3600000),
                user_name: 'John Doe'
            },
            {
                id: 2,
                type: 'attendance',
                action: 'updated',
                description: 'Attendance marked for 50 employees',
                timestamp: new Date(Date.now() - 7200000),
                user_name: 'System'
            }
        ];
    }

    async getUpcomingEvents(companyId) {
        // This would typically come from an events service
        return [
            {
                id: 1,
                title: 'Team Meeting',
                date: new Date(Date.now() + 86400000),
                type: 'meeting'
            },
            {
                id: 2,
                title: 'Salary Processing',
                date: new Date(Date.now() + 2592000000),
                type: 'salary'
            }
        ];
    }

    async generateCompanyReports(companyId) {
        // This would typically generate various reports
        return {
            attendance: {
                title: 'Attendance Report',
                generated: new Date(),
                data: []
            },
            leaves: {
                title: 'Leaves Report',
                generated: new Date(),
                data: []
            },
            expenses: {
                title: 'Expenses Report',
                generated: new Date(),
                data: []
            }
        };
    }
}

module.exports = new CompanyController();