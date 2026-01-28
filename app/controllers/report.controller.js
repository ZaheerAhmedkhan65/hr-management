//app/controllers/report.controller.js
const ReportService = require('../services/report.service');
const AttendanceService = require('../services/attendance.service');
const LeaveService = require('../services/leave.service');
const ExpenseService = require('../services/expense.service');
const SalaryService = require('../services/salary.service');
const UserService = require('../services/user.service');
const ApplicationController = require('./application.controller');

class ReportController extends ApplicationController {
    constructor() {
        super(ReportService);
        this.attendanceService = AttendanceService;
        this.leaveService = LeaveService;
        this.expenseService = ExpenseService;
        this.salaryService = SalaryService;
        this.userService = UserService;
    }

    // Generate attendance report
    async generateAttendanceReport(req, res) {
        try {
            const companyId = req.params.companyId || req.user.companyId;
            const filters = {
                month: req.query.month,
                year: req.query.year,
                department_id: req.query.department_id
            };

            // Check permission
            if (!this.hasCompanyAccess(req.user, companyId)) {
                return this.error(res, 'Access denied', 403);
            }

            const result = await this.attendanceService.getAttendanceReport(companyId, filters);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            // Format report data
            const report = this.formatAttendanceReport(result.data);

            // For web requests
            if (!req.xhr && !req.headers.accept?.includes('application/json')) {
                return res.render('reports/attendance', {
                    title: 'Attendance Report',
                    report: report,
                    filters: filters
                });
            }

            // Check if export is requested
            if (req.query.export === 'csv') {
                const csv = this.generateAttendanceCSV(report);
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename=attendance-report-${Date.now()}.csv`);
                return res.send(csv);
            }

            if (req.query.export === 'pdf') {
                // Generate PDF (would typically use a PDF library)
                return this.success(res, report, 'PDF export not implemented yet');
            }

            return this.success(res, report, 'Attendance report generated');

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Generate user attendance report
    async generateUserAttendanceReport(req, res) {
        try {
            const userId = req.params.userId;
            const filters = {
                start_date: req.query.start_date,
                end_date: req.query.end_date
            };

            // Check permission
            if (!this.hasUserAccess(req.user, userId)) {
                return this.error(res, 'Access denied', 403);
            }

            const result = await this.attendanceService.getAttendance(userId, filters);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            const report = this.formatUserAttendanceReport(result.data);

            return this.success(res, report, 'User attendance report generated');

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Generate leave report
    async generateLeaveReport(req, res) {
        try {
            const companyId = req.params.companyId || req.user.companyId;
            const filters = {
                start_date: req.query.start_date,
                end_date: req.query.end_date,
                department_id: req.query.department_id
            };

            // Check permission
            if (!this.hasCompanyAccess(req.user, companyId)) {
                return this.error(res, 'Access denied', 403);
            }

            const result = await this.leaveService.getLeavesByDateRange(companyId, filters.start_date, filters.end_date);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            const report = this.formatLeaveReport(result.data);

            // For web requests
            if (!req.xhr && !req.headers.accept?.includes('application/json')) {
                return res.render('reports/leave', {
                    title: 'Leave Report',
                    report: report,
                    filters: filters
                });
            }

            return this.success(res, report, 'Leave report generated');

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Generate expense report
    async generateExpenseReport(req, res) {
        try {
            const companyId = req.params.companyId || req.user.companyId;
            const filters = {
                start_date: req.query.start_date,
                end_date: req.query.end_date,
                expense_type: req.query.expense_type
            };

            // Check permission
            if (!this.hasCompanyAccess(req.user, companyId)) {
                return this.error(res, 'Access denied', 403);
            }

            const result = await this.expenseService.getExpensesByDateRange(companyId, filters.start_date, filters.end_date);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            const report = this.formatExpenseReport(result.data);

            // For web requests
            if (!req.xhr && !req.headers.accept?.includes('application/json')) {
                return res.render('reports/expense', {
                    title: 'Expense Report',
                    report: report,
                    filters: filters
                });
            }

            return this.success(res, report, 'Expense report generated');

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Generate salary report
    async generateSalaryReport(req, res) {
        try {
            const companyId = req.params.companyId || req.user.companyId;
            const filters = {
                year: req.query.year || new Date().getFullYear(),
                month: req.query.month
            };

            // Check permission
            if (!this.hasCompanyAccess(req.user, companyId)) {
                return this.error(res, 'Access denied', 403);
            }

            const result = await this.salaryService.getSalarySummary(companyId, filters.year);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            const report = this.formatSalaryReport(result.data, filters);

            // For web requests
            if (!req.xhr && !req.headers.accept?.includes('application/json')) {
                return res.render('reports/salary', {
                    title: 'Salary Report',
                    report: report,
                    filters: filters
                });
            }

            return this.success(res, report, 'Salary report generated');

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Generate user report
    async generateUserReport(req, res) {
        try {
            const companyId = req.params.companyId || req.user.companyId;
            const filters = {
                department: req.query.department,
                role: req.query.role,
                status: req.query.status
            };

            // Check permission
            if (!this.hasCompanyAccess(req.user, companyId)) {
                return this.error(res, 'Access denied', 403);
            }

            const result = await this.userService.getUsers(companyId, filters);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            const report = this.formatUserReport(result.data);

            return this.success(res, report, 'User report generated');

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Generate department report
    async generateDepartmentReport(req, res) {
        try {
            const companyId = req.params.companyId || req.user.companyId;

            // Check permission
            if (!this.hasCompanyAccess(req.user, companyId)) {
                return this.error(res, 'Access denied', 403);
            }

            // This would typically come from a department service
            const report = {
                summary: {
                    total_departments: 8,
                    total_employees: 150,
                    avg_employees_per_dept: 18.75
                },
                departments: [
                    { name: 'IT', employee_count: 25, avg_salary: 75000 },
                    { name: 'HR', employee_count: 15, avg_salary: 65000 },
                    { name: 'Finance', employee_count: 20, avg_salary: 70000 },
                    { name: 'Sales', employee_count: 30, avg_salary: 60000 },
                    { name: 'Marketing', employee_count: 18, avg_salary: 55000 },
                    { name: 'Operations', employee_count: 25, avg_salary: 50000 },
                    { name: 'R&D', employee_count: 12, avg_salary: 80000 },
                    { name: 'Support', employee_count: 5, avg_salary: 45000 }
                ]
            };

            return this.success(res, report, 'Department report generated');

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Generate custom report
    async generateCustomReport(req, res) {
        try {
            const { report_type, filters, format } = req.body;
            const companyId = req.user.companyId;

            // Check permission
            if (!this.hasCompanyAccess(req.user, companyId)) {
                return this.error(res, 'Access denied', 403);
            }

            let report;
            switch (report_type) {
                case 'attendance':
                    report = await this.generateAttendanceReportData(companyId, filters);
                    break;
                case 'leave':
                    report = await this.generateLeaveReportData(companyId, filters);
                    break;
                case 'expense':
                    report = await this.generateExpenseReportData(companyId, filters);
                    break;
                case 'salary':
                    report = await this.generateSalaryReportData(companyId, filters);
                    break;
                case 'user':
                    report = await this.generateUserReportData(companyId, filters);
                    break;
                default:
                    return this.error(res, 'Invalid report type', 400);
            }

            // Handle different formats
            if (format === 'csv') {
                const csv = this.convertToCSV(report);
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename=${report_type}-report-${Date.now()}.csv`);
                return res.send(csv);
            }

            if (format === 'pdf') {
                // Generate PDF
                return this.success(res, report, 'PDF export not implemented yet');
            }

            return this.success(res, report, 'Custom report generated');

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Get report templates (Admin)
    async getReportTemplates(req, res) {
        try {
            // This would typically come from database
            const templates = [
                {
                    id: 1,
                    name: 'Monthly Attendance Summary',
                    description: 'Summary of attendance for the month',
                    type: 'attendance',
                    parameters: ['month', 'year'],
                    created_at: new Date()
                },
                {
                    id: 2,
                    name: 'Leave Balance Report',
                    description: 'Report showing employee leave balances',
                    type: 'leave',
                    parameters: ['as_of_date'],
                    created_at: new Date()
                },
                {
                    id: 3,
                    name: 'Expense Analysis',
                    description: 'Detailed analysis of company expenses',
                    type: 'expense',
                    parameters: ['start_date', 'end_date', 'department'],
                    created_at: new Date()
                }
            ];

            return this.success(res, templates, 'Report templates retrieved');

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Create report template (Admin)
    async createReportTemplate(req, res) {
        try {
            const templateData = req.body;

            // Validate data
            if (!templateData.name || !templateData.type) {
                return this.error(res, 'Name and type are required', 400);
            }

            // This would typically save to database
            const newTemplate = {
                id: Date.now(),
                ...templateData,
                created_at: new Date(),
                created_by: req.user.id
            };

            return this.success(res, newTemplate, 'Report template created', 201);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Export report
    async exportReport(req, res) {
        try {
            const reportId = req.params.reportId;
            const format = req.query.format || 'csv';

            // This would typically retrieve saved report from database
            // For now, generate a sample report
            const report = {
                id: reportId,
                name: 'Sample Report',
                data: [
                    { column1: 'Data 1', column2: 'Data 2', column3: 'Data 3' },
                    { column1: 'Data 4', column2: 'Data 5', column3: 'Data 6' }
                ]
            };

            if (format === 'csv') {
                const csv = this.convertToCSV(report.data);
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename=report-${reportId}.csv`);
                return res.send(csv);
            }

            if (format === 'pdf') {
                // Generate PDF
                return this.success(res, report, 'PDF export not implemented yet');
            }

            if (format === 'excel') {
                // Generate Excel
                return this.success(res, report, 'Excel export not implemented yet');
            }

            return this.success(res, report, 'Report exported');

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

    // Format reports
    formatAttendanceReport(data) {
        return {
            summary: data.totals,
            details: data.report,
            generated: new Date(),
            period: `${data.month}/${data.year}`
        };
    }

    formatUserAttendanceReport(data) {
        return {
            summary: data.summary,
            attendance: data.attendance,
            generated: new Date(),
            period: `${data.start_date} to ${data.end_date}`
        };
    }

    formatLeaveReport(data) {
        const summary = {
            total_leaves: data.length,
            approved: data.filter(l => l.status === 'approved').length,
            pending: data.filter(l => l.status === 'pending').length,
            rejected: data.filter(l => l.status === 'rejected').length,
            by_type: {}
        };

        data.forEach(leave => {
            if (!summary.by_type[leave.leave_type]) {
                summary.by_type[leave.leave_type] = { count: 0, total_days: 0 };
            }
            summary.by_type[leave.leave_type].count++;
            summary.by_type[leave.leave_type].total_days += leave.total_days || 0;
        });

        return {
            summary,
            leaves: data,
            generated: new Date()
        };
    }

    formatExpenseReport(data) {
        const summary = {
            total_expenses: data.length,
            total_amount: 0,
            approved_amount: 0,
            pending_amount: 0,
            rejected_amount: 0,
            by_type: {}
        };

        data.forEach(expense => {
            const amount = parseFloat(expense.amount) || 0;
            summary.total_amount += amount;

            if (expense.status === 'approved') {
                summary.approved_amount += amount;
            } else if (expense.status === 'pending') {
                summary.pending_amount += amount;
            } else if (expense.status === 'rejected') {
                summary.rejected_amount += amount;
            }

            if (!summary.by_type[expense.expense_type]) {
                summary.by_type[expense.expense_type] = { count: 0, amount: 0 };
            }
            summary.by_type[expense.expense_type].count++;
            summary.by_type[expense.expense_type].amount += amount;
        });

        return {
            summary,
            expenses: data,
            generated: new Date()
        };
    }

    formatSalaryReport(data, filters) {
        return {
            summary: {
                total_salaries: data.length,
                total_amount: data.reduce((sum, item) => sum + parseFloat(item.total_payable) || 0, 0),
                paid_amount: data.reduce((sum, item) => sum + parseFloat(item.total_paid) || 0, 0),
                pending_amount: data.reduce((sum, item) => sum + (parseFloat(item.total_payable) - parseFloat(item.total_paid)) || 0, 0)
            },
            monthly_data: data,
            generated: new Date(),
            period: filters.year
        };
    }

    formatUserReport(data) {
        return {
            summary: {
                total_users: data.users.length,
                by_role: {
                    admin: data.users.filter(u => u.role === 'admin').length,
                    hr: data.users.filter(u => u.role === 'hr').length,
                    employee: data.users.filter(u => u.role === 'employee').length
                },
                by_status: {
                    active: data.users.filter(u => u.status === 'active').length,
                    inactive: data.users.filter(u => u.status === 'inactive').length,
                    suspended: data.users.filter(u => u.status === 'suspended').length
                }
            },
            users: data.users,
            generated: new Date()
        };
    }

    // Generate CSV
    generateAttendanceCSV(report) {
        const headers = ['Employee ID', 'Name', 'Department', 'Working Days', 'Present Days', 'Absent Days', 'Late Days', 'Total Hours'];
        const rows = report.details.map(item => [
            item.employee_id,
            item.employee_name,
            item.department_name,
            item.working_days,
            item.present_days,
            item.absent_days,
            item.late_days,
            item.total_hours
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    convertToCSV(data) {
        if (!data || data.length === 0) return '';

        const headers = Object.keys(data[0]);
        const rows = data.map(item => headers.map(header => item[header]));

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    // Data generation methods for custom reports
    async generateAttendanceReportData(companyId, filters) {
        const result = await this.attendanceService.getAttendanceReport(companyId, filters);
        return result.success ? this.formatAttendanceReport(result.data) : null;
    }

    async generateLeaveReportData(companyId, filters) {
        const result = await this.leaveService.getLeavesByDateRange(companyId, filters.start_date, filters.end_date);
        return result.success ? this.formatLeaveReport(result.data) : null;
    }

    async generateExpenseReportData(companyId, filters) {
        const result = await this.expenseService.getExpensesByDateRange(companyId, filters.start_date, filters.end_date);
        return result.success ? this.formatExpenseReport(result.data) : null;
    }

    async generateSalaryReportData(companyId, filters) {
        const result = await this.salaryService.getSalarySummary(companyId, filters.year);
        return result.success ? this.formatSalaryReport(result.data, filters) : null;
    }

    async generateUserReportData(companyId, filters) {
        const result = await this.userService.getUsers(companyId, filters);
        return result.success ? this.formatUserReport(result.data) : null;
    }
}

module.exports = new ReportController();