//app/services/leave.service.js
const LeaveModel = require('../models/leave.model');
const UserModel = require('../models/user.model');
const moment = require('moment');
const ApplicationService = require('./application.service');

class LeaveService extends ApplicationService {
    async applyLeave(leaveData, applicantId) {
        try {
            // Validate dates
            const startDate = moment(leaveData.start_date);
            const endDate = moment(leaveData.end_date);

            if (startDate.isAfter(endDate)) {
                return this.error('Start date cannot be after end date');
            }

            if (startDate.isBefore(moment(), 'day')) {
                return this.error('Cannot apply leave for past dates');
            }

            // Calculate total days (excluding weekends)
            let totalDays = 0;
            let currentDate = startDate.clone();
            while (currentDate.isSameOrBefore(endDate)) {
                if (currentDate.day() !== 0 && currentDate.day() !== 6) { // Skip weekends
                    totalDays++;
                }
                currentDate.add(1, 'day');
            }

            if (totalDays <= 0) {
                return this.error('No working days in selected date range');
            }

            // Check for overlapping leaves
            const [overlap] = await LeaveModel.checkOverlap(
                leaveData.user_id,
                leaveData.start_date,
                leaveData.end_date
            );

            if (overlap.count > 0) {
                return this.error('You already have a leave application for these dates');
            }

            leaveData.total_days = totalDays;
            const result = await LeaveModel.create(leaveData);

            return this.success({
                id: result.insertId,
                total_days: totalDays
            }, 'Leave application submitted successfully');
        } catch (error) {
            console.error('Apply leave error:', error);
            return this.error('Failed to submit leave application');
        }
    }

    async getLeaves(userId) {
        try {
            const leaves = await LeaveModel.getByUser(userId);
            return this.success(leaves, 'Leaves retrieved successfully');
        } catch (error) {
            console.error('Get leaves error:', error);
            return this.error('Failed to retrieve leaves');
        }
    }

    async getLeaveDetails(leaveId) {
        try {
            const [leave] = await LeaveModel.findById(leaveId);
            if (!leave) {
                return this.error('Leave application not found');
            }
            return this.success(leave, 'Leave details retrieved');
        } catch (error) {
            console.error('Get leave details error:', error);
            return this.error('Failed to retrieve leave details');
        }
    }

    async getPendingLeaves(companyId) {
        try {
            const leaves = await LeaveModel.getPendingByCompany(companyId);
            return this.success(leaves, 'Pending leaves retrieved');
        } catch (error) {
            console.error('Get pending leaves error:', error);
            return this.error('Failed to retrieve pending leaves');
        }
    }

    async updateLeaveStatus(leaveId, statusData, approverId) {
        try {
            const [leave] = await LeaveModel.findById(leaveId);
            if (!leave) {
                return this.error('Leave application not found');
            }

            if (leave.status !== 'pending') {
                return this.error('Leave application already processed');
            }

            const validStatuses = ['approved', 'rejected'];
            if (!validStatuses.includes(statusData.status)) {
                return this.error('Invalid status');
            }

            await LeaveModel.updateStatus(leaveId, statusData.status, approverId);

            // Get updated leave details
            const [updatedLeave] = await LeaveModel.findById(leaveId);
            return this.success(updatedLeave, `Leave application ${statusData.status}`);
        } catch (error) {
            console.error('Update leave status error:', error);
            return this.error('Failed to update leave status');
        }
    }

    async getLeaveSummary(userId, year = null) {
        try {
            const targetYear = year || moment().year();
            const summary = await LeaveModel.getLeaveSummary(userId, targetYear);

            const totalApproved = summary.reduce((sum, item) => sum + item.approved_days, 0);
            const totalPending = summary.reduce((sum, item) => sum + item.pending_days, 0);

            return this.success({
                summary,
                totals: {
                    approved: totalApproved,
                    pending: totalPending,
                    year: targetYear
                }
            }, 'Leave summary retrieved');
        } catch (error) {
            console.error('Get leave summary error:', error);
            return this.error('Failed to retrieve leave summary');
        }
    }

    async getLeavesByDateRange(companyId, startDate, endDate) {
        try {
            if (!startDate || !endDate) {
                return this.error('Start date and end date are required');
            }

            if (moment(startDate).isAfter(endDate)) {
                return this.error('Start date cannot be after end date');
            }

            const leaves = await LeaveModel.getByDateRange(companyId, startDate, endDate);
            return this.success(leaves, 'Leaves retrieved successfully');
        } catch (error) {
            console.error('Get leaves by date error:', error);
            return this.error('Failed to retrieve leaves');
        }
    }

    async cancelLeave(leaveId, userId) {
        try {
            const [leave] = await LeaveModel.findById(leaveId);
            if (!leave) {
                return this.error('Leave application not found');
            }

            if (leave.user_id !== userId) {
                return this.error('You can only cancel your own leaves');
            }

            if (leave.status !== 'pending') {
                return this.error('Only pending leaves can be cancelled');
            }

            // Soft delete or update status to cancelled
            await LeaveModel.query(
                'UPDATE leaves SET status = "cancelled" WHERE id = ?',
                [leaveId]
            );

            return this.success(null, 'Leave application cancelled');
        } catch (error) {
            console.error('Cancel leave error:', error);
            return this.error('Failed to cancel leave');
        }
    }
}

module.exports = new LeaveService();