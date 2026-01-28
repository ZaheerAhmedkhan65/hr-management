//app/controllers/leave.controller.js
const LeaveService = require('../services/leave.service');
const ApplicationController = require('./application.controller');

class LeaveController extends ApplicationController {
    constructor() {
        super(LeaveService);
    }

    // Apply for leave
    async applyLeave(req, res) {
        try {
            const leaveData = req.body;
            leaveData.user_id = req.user.id;
            leaveData.company_id = req.user.companyId;

            const result = await this.service.applyLeave(leaveData, req.user.id);

            if (!result.success) {
                // For web requests
                if (!req.xhr && !req.headers.accept?.includes('application/json')) {
                    req.flash('error_msg', result.message);
                    req.flash('old_input', req.body);
                    return res.redirect('/leaves/apply');
                }
                return this.error(res, result.message, 400);
            }

            if (!req.xhr && !req.headers.accept?.includes('application/json')) {
                req.flash('success_msg', result.message);
                return res.redirect('/leaves/my');
            }

            return this.success(res, result.data, result.message, 201);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Get my leaves
    async getMyLeaves(req, res) {
        try {
            const userId = req.user.id;
            const filters = {
                status: req.query.status,
                start_date: req.query.start_date,
                end_date: req.query.end_date,
                leave_type: req.query.leave_type
            };

            const result = await this.service.getLeaves(userId);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            // Filter leaves if needed
            let leaves = result.data;
            if (filters.status && filters.status !== 'all') {
                leaves = leaves.filter(leave => leave.status === filters.status);
            }

            // For web requests
            if (!req.xhr && !req.headers.accept?.includes('application/json')) {
                return res.render('leaves/my', {
                    title: 'My Leaves',
                    leaves: leaves,
                    filters
                });
            }

            return this.success(res, { leaves, filters }, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Get leave details
    async getLeaveDetails(req, res) {
        try {
            const leaveId = req.params.leaveId;

            const result = await this.service.getLeaveDetails(leaveId);

            if (!result.success) {
                return this.error(res, result.message, 404);
            }

            // Check permission
            if (!this.hasLeaveAccess(req.user, result.data)) {
                return this.error(res, 'Access denied', 403);
            }

            return this.success(res, result.data, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Get pending leaves (HR/Admin)
    async getPendingLeaves(req, res) {
        try {
            const companyId = req.user.companyId;

            const result = await this.service.getPendingLeaves(companyId);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            // For web requests
            if (!req.xhr && !req.headers.accept?.includes('application/json')) {
                return res.render('leaves/pending', {
                    title: 'Pending Leaves',
                    leaves: result.data
                });
            }

            return this.success(res, result.data, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Update leave status (HR/Admin)
    async updateLeaveStatus(req, res) {
        try {
            const leaveId = req.params.leaveId;
            const statusData = req.body;

            // Get leave details first to check permission
            const leaveDetails = await this.service.getLeaveDetails(leaveId);

            if (!leaveDetails.success) {
                return this.error(res, leaveDetails.message, 404);
            }

            // Check permission
            if (!this.canApproveLeave(req.user, leaveDetails.data)) {
                return this.error(res, 'Access denied', 403);
            }

            const result = await this.service.updateLeaveStatus(leaveId, statusData, req.user.id);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            return this.success(res, result.data, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Get company leaves (HR/Admin)
    async getCompanyLeaves(req, res) {
        try {
            const companyId = req.params.companyId || req.user.companyId;
            const filters = {
                status: req.query.status,
                start_date: req.query.start_date,
                end_date: req.query.end_date,
                leave_type: req.query.leave_type
            };

            // Check permission
            if (!this.hasCompanyAccess(req.user, companyId)) {
                return this.error(res, 'Access denied', 403);
            }

            const result = await this.service.getLeavesByDateRange(companyId, filters.start_date, filters.end_date);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            // Filter leaves if needed
            let leaves = result.data;
            if (filters.status && filters.status !== 'all') {
                leaves = leaves.filter(leave => leave.status === filters.status);
            }
            if (filters.leave_type) {
                leaves = leaves.filter(leave => leave.leave_type === filters.leave_type);
            }

            return this.success(res, { leaves, filters }, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Get leave report
    async getLeaveReport(req, res) {
        try {
            const companyId = req.params.companyId || req.user.companyId;
            const filters = {
                start_date: req.query.start_date,
                end_date: req.query.end_date
            };

            // Check permission
            if (!this.hasCompanyAccess(req.user, companyId)) {
                return this.error(res, 'Access denied', 403);
            }

            const result = await this.service.getLeavesByDateRange(companyId, filters.start_date, filters.end_date);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            // Generate report data
            const report = this.generateLeaveReport(result.data);

            // For web requests
            if (!req.xhr && !req.headers.accept?.includes('application/json')) {
                return res.render('leaves/report', {
                    title: 'Leave Report',
                    report: report,
                    filters
                });
            }

            return this.success(res, report, 'Leave report generated');

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Get leave summary
    async getLeaveSummary(req, res) {
        try {
            const userId = req.params.userId;
            const year = req.query.year || new Date().getFullYear();

            // Check permission
            if (!this.hasUserAccess(req.user, userId)) {
                return this.error(res, 'Access denied', 403);
            }

            const result = await this.service.getLeaveSummary(userId, year);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            return this.success(res, result.data, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Get company leave summary
    async getCompanyLeaveSummary(req, res) {
        try {
            const companyId = req.params.companyId || req.user.companyId;
            const year = req.query.year || new Date().getFullYear();

            // Check permission
            if (!this.hasCompanyAccess(req.user, companyId)) {
                return this.error(res, 'Access denied', 403);
            }

            // Get all leaves for the company
            const startDate = `${year}-01-01`;
            const endDate = `${year}-12-31`;

            const result = await this.service.getLeavesByDateRange(companyId, startDate, endDate);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            // Generate summary
            const summary = this.generateCompanyLeaveSummary(result.data, year);

            return this.success(res, summary, 'Company leave summary generated');

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Cancel leave
    async cancelLeave(req, res) {
        try {
            const leaveId = req.params.leaveId;
            const userId = req.user.id;

            // Get leave details first
            const leaveDetails = await this.service.getLeaveDetails(leaveId);

            if (!leaveDetails.success) {
                return this.error(res, leaveDetails.message, 404);
            }

            // Check permission
            if (!this.canCancelLeave(req.user, leaveDetails.data)) {
                return this.error(res, 'Access denied', 403);
            }

            const result = await this.service.cancelLeave(leaveId, userId);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            return this.success(res, null, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Get leave types (Admin)
    async getLeaveTypes(req, res) {
        try {
            // This would typically come from a database
            const leaveTypes = [
                { id: 1, name: 'Sick Leave', max_days: 12, description: 'For medical reasons' },
                { id: 2, name: 'Casual Leave', max_days: 10, description: 'For personal reasons' },
                { id: 3, name: 'Annual Leave', max_days: 20, description: 'Paid annual vacation' },
                { id: 4, name: 'Maternity Leave', max_days: 90, description: 'For expecting mothers' },
                { id: 5, name: 'Paternity Leave', max_days: 7, description: 'For new fathers' },
                { id: 6, name: 'Unpaid Leave', max_days: 30, description: 'Leave without pay' }
            ];

            return this.success(res, leaveTypes, 'Leave types retrieved');

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Create leave type (Admin)
    async createLeaveType(req, res) {
        try {
            const leaveTypeData = req.body;

            // Validate data
            if (!leaveTypeData.name || !leaveTypeData.max_days) {
                return this.error(res, 'Name and max days are required', 400);
            }

            // This would typically save to database
            const newLeaveType = {
                id: Date.now(),
                ...leaveTypeData,
                created_at: new Date()
            };

            return this.success(res, newLeaveType, 'Leave type created', 201);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Helper methods for permissions
    hasCompanyAccess(currentUser, companyId) {
        if (currentUser.role === 'admin') return true;
        if (currentUser.companyId === parseInt(companyId)) return true;
        return false;
    }

    hasUserAccess(currentUser, targetUserId) {
        if (currentUser.role === 'admin') return true;
        if (currentUser.role === 'hr' && currentUser.companyId) return true;
        if (currentUser.id === parseInt(targetUserId)) return true;
        return false;
    }

    hasLeaveAccess(currentUser, leave) {
        if (currentUser.role === 'admin') return true;
        if (currentUser.role === 'hr' && currentUser.companyId === leave.company_id) return true;
        if (currentUser.id === leave.user_id) return true;
        return false;
    }

    canApproveLeave(currentUser, leave) {
        if (currentUser.role === 'admin') return true;
        if (currentUser.role === 'hr' && currentUser.companyId === leave.company_id) return true;
        return false;
    }

    canCancelLeave(currentUser, leave) {
        if (currentUser.role === 'admin') return true;
        if (currentUser.role === 'hr' && currentUser.companyId === leave.company_id) return true;
        if (currentUser.id === leave.user_id && leave.status === 'pending') return true;
        return false;
    }

    // Generate leave report
    generateLeaveReport(leaves) {
        const summary = {
            total: leaves.length,
            approved: leaves.filter(l => l.status === 'approved').length,
            pending: leaves.filter(l => l.status === 'pending').length,
            rejected: leaves.filter(l => l.status === 'rejected').length,
            by_type: {}
        };

        // Group by leave type
        leaves.forEach(leave => {
            if (!summary.by_type[leave.leave_type]) {
                summary.by_type[leave.leave_type] = {
                    total: 0,
                    approved: 0,
                    pending: 0,
                    rejected: 0,
                    total_days: 0
                };
            }

            summary.by_type[leave.leave_type].total++;
            summary.by_type[leave.leave_type][leave.status]++;
            summary.by_type[leave.leave_type].total_days += leave.total_days || 0;
        });

        return {
            summary,
            leaves: leaves.slice(0, 100) // Limit to 100 records for report
        };
    }

    // Generate company leave summary
    generateCompanyLeaveSummary(leaves, year) {
        const monthlySummary = {};
        const departmentSummary = {};
        const employeeSummary = {};

        // Initialize months
        for (let i = 1; i <= 12; i++) {
            monthlySummary[i] = {
                total: 0,
                approved: 0,
                pending: 0,
                rejected: 0
            };
        }

        // Process leaves
        leaves.forEach(leave => {
            const month = new Date(leave.start_date).getMonth() + 1;

            // Monthly summary
            monthlySummary[month].total++;
            monthlySummary[month][leave.status]++;

            // Department summary
            const dept = leave.department_name || 'Unknown';
            if (!departmentSummary[dept]) {
                departmentSummary[dept] = { total: 0, employees: new Set() };
            }
            departmentSummary[dept].total++;
            departmentSummary[dept].employees.add(leave.user_id);

            // Employee summary
            if (!employeeSummary[leave.user_id]) {
                employeeSummary[leave.user_id] = {
                    name: leave.employee_name,
                    total_leaves: 0,
                    total_days: 0
                };
            }
            employeeSummary[leave.user_id].total_leaves++;
            employeeSummary[leave.user_id].total_days += leave.total_days || 0;
        });

        // Convert sets to counts
        Object.keys(departmentSummary).forEach(dept => {
            departmentSummary[dept].employee_count = departmentSummary[dept].employees.size;
            delete departmentSummary[dept].employees;
        });

        return {
            year,
            monthly_summary: monthlySummary,
            department_summary: departmentSummary,
            employee_summary: Object.values(employeeSummary).sort((a, b) => b.total_days - a.total_days).slice(0, 10),
            total_leaves: leaves.length,
            total_employees: Object.keys(employeeSummary).length
        };
    }
}

module.exports = new LeaveController();