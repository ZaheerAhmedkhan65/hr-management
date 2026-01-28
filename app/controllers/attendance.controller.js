//app/controllers/attendance.controller.js
const AttendanceService = require('../services/attendance.service');
const ApplicationController = require('./application.controller');

class AttendanceController extends ApplicationController {
    constructor() {
        super(AttendanceService);
    }

    // Check-in attendance
    async checkIn(req, res) {
        try {
            const userId = req.user.id;
            const companyId = req.user.companyId;
            const checkInData = req.body;

            // Add location if available
            if (req.ip) {
                checkInData.ip_address = req.ip;
            }

            if (req.headers['user-agent']) {
                checkInData.user_agent = req.headers['user-agent'];
            }

            const result = await this.service.checkIn(userId, companyId, checkInData);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            return this.success(res, result.data, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Check-out attendance
    async checkOut(req, res) {
        try {
            const attendanceId = req.params.attendanceId;
            const userId = req.user.id;
            const checkOutData = req.body;

            const result = await this.service.checkOut(attendanceId, userId, checkOutData);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            return this.success(res, result.data, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Get my attendance
    async getMyAttendance(req, res) {
        try {
            const userId = req.user.id;
            const filters = {
                start_date: req.query.start_date,
                end_date: req.query.end_date
            };

            const result = await this.service.getAttendance(userId, filters);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            // For web requests
            if (!req.xhr && !req.headers.accept?.includes('application/json')) {
                return res.render('attendance/my', {
                    title: 'My Attendance',
                    attendance: result.data.attendance,
                    summary: result.data.summary,
                    filters
                });
            }

            return this.success(res, result.data, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Mark attendance (HR/Admin)
    async markAttendance(req, res) {
        try {
            const attendanceData = req.body;
            attendanceData.company_id = req.user.companyId;

            const result = await this.service.markAttendance(attendanceData, req.user.id);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            return this.success(res, result.data, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Update attendance status (HR/Admin)
    async updateAttendanceStatus(req, res) {
        try {
            const attendanceId = req.params.attendanceId;
            const statusData = req.body;

            const result = await this.service.updateAttendanceStatus(attendanceId, statusData, req.user.id);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            return this.success(res, result.data, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Get company attendance
    async getCompanyAttendance(req, res) {
        try {
            const companyId = req.params.companyId || req.user.companyId;
            const date = req.query.date;

            // Check permission
            if (!this.hasCompanyAccess(req.user, companyId)) {
                return this.error(res, 'Access denied', 403);
            }

            const result = await this.service.getCompanyAttendance(companyId, date);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            // For web requests
            if (!req.xhr && !req.headers.accept?.includes('application/json')) {
                return res.render('attendance/company', {
                    title: 'Company Attendance',
                    attendance: result.data.attendance,
                    summary: result.data.summary,
                    date: date || new Date().toISOString().split('T')[0]
                });
            }

            return this.success(res, result.data, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Get user attendance (HR/Admin)
    async getUserAttendance(req, res) {
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

            const result = await this.service.getAttendance(userId, filters);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            return this.success(res, result.data, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Get attendance report
    async getAttendanceReport(req, res) {
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

            const result = await this.service.getAttendanceReport(companyId, filters);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            // For web requests
            if (!req.xhr && !req.headers.accept?.includes('application/json')) {
                return res.render('attendance/report', {
                    title: 'Attendance Report',
                    report: result.data.report,
                    totals: result.data.totals,
                    filters
                });
            }

            return this.success(res, result.data, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Get user attendance report
    async getUserAttendanceReport(req, res) {
        try {
            const userId = req.params.userId;
            const filters = {
                month: req.query.month,
                year: req.query.year
            };

            // Check permission
            if (!this.hasUserAccess(req.user, userId)) {
                return this.error(res, 'Access denied', 403);
            }

            const result = await this.service.getAttendanceReport(userId, filters);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            return this.success(res, result.data, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Get attendance summary
    async getAttendanceSummary(req, res) {
        try {
            const userId = req.params.userId;
            const { month, year } = req.query;

            // Check permission
            if (!this.hasUserAccess(req.user, userId)) {
                return this.error(res, 'Access denied', 403);
            }

            const result = await this.service.getAttendanceSummary(userId, month, year);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            return this.success(res, result.data, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Get company attendance summary
    async getCompanyAttendanceSummary(req, res) {
        try {
            const companyId = req.params.companyId || req.user.companyId;
            const { month, year } = req.query;

            // Check permission
            if (!this.hasCompanyAccess(req.user, companyId)) {
                return this.error(res, 'Access denied', 403);
            }

            const result = await this.service.getAttendanceReport(companyId, { month, year });

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            return this.success(res, result.data, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Export attendance data
    async exportAttendance(req, res) {
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

            const result = await this.service.getAttendanceReport(companyId, filters);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            // Generate CSV
            const csv = this.generateAttendanceCSV(result.data.report);

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=attendance-${Date.now()}.csv`);

            return res.send(csv);

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

    // Generate CSV from attendance data
    generateAttendanceCSV(report) {
        const headers = ['Employee ID', 'Name', 'Department', 'Date', 'Check In', 'Check Out', 'Hours', 'Status'];
        const rows = report.map(record => [
            record.employee_id,
            record.employee_name,
            record.department_name,
            new Date(record.check_in).toLocaleDateString(),
            new Date(record.check_in).toLocaleTimeString(),
            record.check_out ? new Date(record.check_out).toLocaleTimeString() : '',
            record.total_hours || '0',
            record.status
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
}

module.exports = new AttendanceController();