//app/services/attendance.service.js
const AttendanceModel = require('../models/attendance.model');
const UserModel = require('../models/user.model');
const moment = require('moment');
const ApplicationService = require('./application.service');

class AttendanceService extends ApplicationService {
    async checkIn(userId, companyId, checkInData = {}) {
        try {
            // Check if already checked in today
            const todayAttendance = await AttendanceModel.getTodayAttendance(userId);
            if (todayAttendance.length > 0) {
                return this.error('Already checked in today');
            }

            const checkInTime = checkInData.check_in || new Date();
            const result = await AttendanceModel.checkIn(userId, companyId, checkInTime);

            return this.success({
                id: result.insertId,
                check_in: checkInTime,
                status: 'present'
            }, 'Checked in successfully');
        } catch (error) {
            console.error('Check-in error:', error);
            return this.error('Failed to check in');
        }
    }

    async checkOut(attendanceId, userId, checkOutData = {}) {
        try {
            // Get attendance record
            const [attendance] = await AttendanceModel.query(
                'SELECT * FROM attendance WHERE id = ? AND user_id = ?',
                [attendanceId, userId]
            );

            if (!attendance) {
                return this.error('Attendance record not found');
            }

            if (attendance.check_out) {
                return this.error('Already checked out');
            }

            const checkOutTime = checkOutData.check_out || new Date();
            const checkInTime = new Date(attendance.check_in);
            const totalHours = (checkOutTime - checkInTime) / (1000 * 60 * 60); // Convert to hours

            // Determine status based on check-in time
            let status = 'present';
            const checkInHour = checkInTime.getHours();
            if (checkInHour > 9) { // Assuming 9 AM is start time
                status = 'late';
            }

            await AttendanceModel.checkOut(attendanceId, checkOutTime, totalHours.toFixed(2));

            return this.success({
                check_out: checkOutTime,
                total_hours: totalHours.toFixed(2),
                status
            }, 'Checked out successfully');
        } catch (error) {
            console.error('Check-out error:', error);
            return this.error('Failed to check out');
        }
    }

    async markAttendance(attendanceData, markerId) {
        try {
            // Verify user exists and belongs to same company
            const [user] = await UserModel.findById(attendanceData.user_id);
            if (!user) {
                return this.error('User not found');
            }

            const result = await AttendanceModel.markAttendance(attendanceData);
            return this.success({ id: result.insertId }, 'Attendance marked successfully');
        } catch (error) {
            console.error('Mark attendance error:', error);
            return this.error('Failed to mark attendance');
        }
    }

    async getAttendance(userId, filters = {}) {
        try {
            let startDate = filters.start_date || moment().startOf('month').format('YYYY-MM-DD');
            let endDate = filters.end_date || moment().endOf('month').format('YYYY-MM-DD');

            const attendance = await AttendanceModel.getByUserAndDate(userId, startDate, endDate);

            // Calculate summary
            const summary = {
                total_days: attendance.length,
                present_days: attendance.filter(a => a.status === 'present' || a.status === 'late').length,
                absent_days: attendance.filter(a => a.status === 'absent').length,
                late_days: attendance.filter(a => a.status === 'late').length,
                half_days: attendance.filter(a => a.status === 'half-day').length,
                total_hours: attendance.reduce((sum, a) => sum + (parseFloat(a.total_hours) || 0), 0)
            };

            return this.success({
                attendance,
                summary,
                start_date: startDate,
                end_date: endDate
            }, 'Attendance retrieved successfully');
        } catch (error) {
            console.error('Get attendance error:', error);
            return this.error('Failed to retrieve attendance');
        }
    }

    async getCompanyAttendance(companyId, date = null) {
        try {
            const targetDate = date || moment().format('YYYY-MM-DD');
            const attendance = await AttendanceModel.getByCompanyAndDate(companyId, targetDate);

            const summary = {
                date: targetDate,
                total_employees: attendance.length,
                present: attendance.filter(a => a.status === 'present' || a.status === 'late').length,
                absent: attendance.filter(a => a.status === 'absent').length,
                late: attendance.filter(a => a.status === 'late').length,
                on_leave: attendance.filter(a => a.status === 'leave').length
            };

            return this.success({
                attendance,
                summary
            }, 'Company attendance retrieved successfully');
        } catch (error) {
            console.error('Get company attendance error:', error);
            return this.error('Failed to retrieve company attendance');
        }
    }

    async updateAttendanceStatus(attendanceId, statusData, updaterId) {
        try {
            const [attendance] = await AttendanceModel.query(
                'SELECT * FROM attendance WHERE id = ?',
                [attendanceId]
            );

            if (!attendance) {
                return this.error('Attendance record not found');
            }

            const validStatuses = ['present', 'absent', 'late', 'half-day', 'leave'];
            if (!validStatuses.includes(statusData.status)) {
                return this.error('Invalid status');
            }

            await AttendanceModel.updateStatus(attendanceId, statusData.status, statusData.notes);
            return this.success({ status: statusData.status }, 'Attendance status updated');
        } catch (error) {
            console.error('Update attendance error:', error);
            return this.error('Failed to update attendance');
        }
    }

    async getAttendanceReport(companyId, filters = {}) {
        try {
            const month = filters.month || moment().month() + 1;
            const year = filters.year || moment().year();

            const report = await AttendanceModel.getMonthlyReport(companyId, month, year);

            // Calculate totals
            const totals = {
                total_employees: report.length,
                total_working_days: report.reduce((sum, r) => sum + (r.working_days || 0), 0),
                total_present_days: report.reduce((sum, r) => sum + (r.present_days || 0), 0),
                total_absent_days: report.reduce((sum, r) => sum + (r.absent_days || 0), 0),
                total_late_days: report.reduce((sum, r) => sum + (r.late_days || 0), 0),
                total_hours: report.reduce((sum, r) => sum + (parseFloat(r.total_hours) || 0), 0)
            };

            return this.success({
                report,
                totals,
                month,
                year
            }, 'Attendance report generated successfully');
        } catch (error) {
            console.error('Get report error:', error);
            return this.error('Failed to generate report');
        }
    }

    async getAttendanceSummary(userId, month, year) {
        try {
            const summary = await AttendanceModel.getAttendanceSummary(userId, month, year);
            return this.success(summary[0], 'Attendance summary retrieved');
        } catch (error) {
            console.error('Get summary error:', error);
            return this.error('Failed to retrieve attendance summary');
        }
    }
}

module.exports = new AttendanceService();