// app/models/attendance.model.js
const ApplicationModel = require('./application.model');

class AttendanceModel extends ApplicationModel {
    // Create attendance record (check-in)
    static checkIn(userId, companyId, checkInTime) {
        return this.query(
            'INSERT INTO attendance (user_id, company_id, check_in, created_at) VALUES (?, ?, ?, CURDATE())',
            [userId, companyId, checkInTime]
        );
    }

    // Update attendance record (check-out)
    static checkOut(attendanceId, checkOutTime, totalHours) {
        return this.query(
            'UPDATE attendance SET check_out = ?, total_hours = ? WHERE id = ?',
            [checkOutTime, totalHours, attendanceId]
        );
    }

    // Get today's attendance for user
    static getTodayAttendance(userId) {
        return this.query(
            'SELECT * FROM attendance WHERE user_id = ? AND DATE(check_in) = CURDATE()',
            [userId]
        );
    }

    // Get attendance by user and date range
    static getByUserAndDate(userId, startDate, endDate) {
        return this.query(
            `SELECT a.*, 
                    CONCAT(u.first_name, ' ', u.last_name) as employee_name,
                    u.position
             FROM attendance a
             JOIN users u ON a.user_id = u.id
             WHERE a.user_id = ? AND DATE(a.check_in) BETWEEN ? AND ?
             ORDER BY a.check_in DESC`,
            [userId, startDate, endDate]
        );
    }

    // Get attendance by company and date
    static getByCompanyAndDate(companyId, date) {
        return this.query(
            `SELECT a.*, 
                    CONCAT(u.first_name, ' ', u.last_name) as employee_name,
                    u.position,
                    d.department_name
             FROM attendance a
             JOIN users u ON a.user_id = u.id
             LEFT JOIN departments d ON u.department_id = d.id
             WHERE a.company_id = ? AND DATE(a.check_in) = ?
             ORDER BY a.check_in`,
            [companyId, date]
        );
    }

    // Get attendance summary for user
    static getAttendanceSummary(userId, month, year) {
        return this.query(
            `SELECT 
                COUNT(*) as total_days,
                SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_days,
                SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days,
                SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_days,
                SUM(CASE WHEN status = 'half-day' THEN 1 ELSE 0 END) as half_days,
                SUM(total_hours) as total_hours
             FROM attendance 
             WHERE user_id = ? 
             AND MONTH(check_in) = ? 
             AND YEAR(check_in) = ?`,
            [userId, month, year]
        );
    }

    // Mark attendance manually (for HR/Admin)
    static markAttendance(attendanceData) {
        const { user_id, company_id, check_in, check_out, total_hours, status, notes } = attendanceData;

        return this.query(
            `INSERT INTO attendance 
            (user_id, company_id, check_in, check_out, total_hours, status, notes, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE())`,
            [user_id, company_id, check_in, check_out, total_hours, status, notes]
        );
    }

    // Update attendance status
    static updateStatus(id, status, notes = null) {
        return this.query(
            'UPDATE attendance SET status = ?, notes = ? WHERE id = ?',
            [status, notes, id]
        );
    }

    // Get monthly attendance report
    static getMonthlyReport(companyId, month, year) {
        return this.query(
            `SELECT 
                u.id,
                CONCAT(u.first_name, ' ', u.last_name) as employee_name,
                d.department_name,
                COUNT(DISTINCT DATE(a.check_in)) as working_days,
                SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_days,
                SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent_days,
                SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) as late_days,
                SUM(a.total_hours) as total_hours
             FROM users u
             LEFT JOIN departments d ON u.department_id = d.id
             LEFT JOIN attendance a ON u.id = a.user_id 
                AND MONTH(a.check_in) = ? 
                AND YEAR(a.check_in) = ?
             WHERE u.company_id = ? AND u.status = 'active'
             GROUP BY u.id
             ORDER BY d.department_name, u.first_name`,
            [month, year, companyId]
        );
    }
}

module.exports = AttendanceModel;