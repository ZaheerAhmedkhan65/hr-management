//app/services/expense.service.js
const ExpenseModel = require('../models/expense.model');
const UserModel = require('../models/user.model');
const moment = require('moment');
const ApplicationService = require('./application.service');

class ExpenseService extends ApplicationService {
    async submitExpense(expenseData, submitterId) {
        try {
            // Set default expense date if not provided
            if (!expenseData.expense_date) {
                expenseData.expense_date = moment().format('YYYY-MM-DD');
            }

            // Validate amount
            if (expenseData.amount <= 0) {
                return this.error('Amount must be greater than 0');
            }

            // Verify user belongs to same company
            const [user] = await UserModel.findById(expenseData.user_id);
            if (!user || user.company_id !== expenseData.company_id) {
                return this.error('Invalid user or company');
            }

            const result = await ExpenseModel.create(expenseData);
            return this.success({
                id: result.insertId
            }, 'Expense submitted successfully');
        } catch (error) {
            console.error('Submit expense error:', error);
            return this.error('Failed to submit expense');
        }
    }

    async getExpenses(userId) {
        try {
            const expenses = await ExpenseModel.getByUser(userId);
            return this.success(expenses, 'Expenses retrieved successfully');
        } catch (error) {
            console.error('Get expenses error:', error);
            return this.error('Failed to retrieve expenses');
        }
    }

    async getExpenseDetails(expenseId) {
        try {
            const [expense] = await ExpenseModel.findById(expenseId);
            if (!expense) {
                return this.error('Expense not found');
            }
            return this.success(expense, 'Expense details retrieved');
        } catch (error) {
            console.error('Get expense details error:', error);
            return this.error('Failed to retrieve expense details');
        }
    }

    async getPendingExpenses(companyId) {
        try {
            const expenses = await ExpenseModel.getPendingByCompany(companyId);
            return this.success(expenses, 'Pending expenses retrieved');
        } catch (error) {
            console.error('Get pending expenses error:', error);
            return this.error('Failed to retrieve pending expenses');
        }
    }

    async updateExpenseStatus(expenseId, statusData, approverId) {
        try {
            const [expense] = await ExpenseModel.findById(expenseId);
            if (!expense) {
                return this.error('Expense not found');
            }

            if (expense.status !== 'pending') {
                return this.error('Expense already processed');
            }

            const validStatuses = ['approved', 'rejected'];
            if (!validStatuses.includes(statusData.status)) {
                return this.error('Invalid status');
            }

            await ExpenseModel.updateStatus(expenseId, statusData.status, approverId);

            // Get updated expense
            const [updatedExpense] = await ExpenseModel.findById(expenseId);
            return this.success(updatedExpense, `Expense ${statusData.status}`);
        } catch (error) {
            console.error('Update expense status error:', error);
            return this.error('Failed to update expense status');
        }
    }

    async getExpenseSummary(companyId, startDate, endDate) {
        try {
            if (!startDate || !endDate) {
                startDate = moment().startOf('month').format('YYYY-MM-DD');
                endDate = moment().endOf('month').format('YYYY-MM-DD');
            }

            const summary = await ExpenseModel.getSummary(companyId, startDate, endDate);

            const totals = {
                total_amount: summary.reduce((sum, item) => sum + parseFloat(item.total_amount), 0),
                approved_amount: summary.reduce((sum, item) => sum + parseFloat(item.approved_amount), 0),
                pending_amount: summary.reduce((sum, item) => sum + parseFloat(item.pending_amount), 0),
                rejected_amount: summary.reduce((sum, item) => sum + parseFloat(item.rejected_amount), 0),
                total_count: summary.reduce((sum, item) => sum + item.count, 0)
            };

            return this.success({
                summary,
                totals,
                start_date: startDate,
                end_date: endDate
            }, 'Expense summary retrieved');
        } catch (error) {
            console.error('Get expense summary error:', error);
            return this.error('Failed to retrieve expense summary');
        }
    }

    async getExpensesByDateRange(companyId, startDate, endDate) {
        try {
            if (!startDate || !endDate) {
                return this.error('Start date and end date are required');
            }

            if (moment(startDate).isAfter(endDate)) {
                return this.error('Start date cannot be after end date');
            }

            const expenses = await ExpenseModel.getByDateRange(companyId, startDate, endDate);
            return this.success(expenses, 'Expenses retrieved successfully');
        } catch (error) {
            console.error('Get expenses by date error:', error);
            return this.error('Failed to retrieve expenses');
        }
    }

    async updateExpense(expenseId, expenseData, updaterId) {
        try {
            const [expense] = await ExpenseModel.findById(expenseId);
            if (!expense) {
                return this.error('Expense not found');
            }

            if (expense.status !== 'pending') {
                return this.error('Only pending expenses can be updated');
            }

            // Only allow updating certain fields
            const allowedFields = ['expense_type', 'description', 'amount', 'expense_date', 'receipt_image'];
            const updateData = {};

            allowedFields.forEach(field => {
                if (expenseData[field] !== undefined) {
                    updateData[field] = expenseData[field];
                }
            });

            if (Object.keys(updateData).length === 0) {
                return this.error('No valid fields to update');
            }

            await ExpenseModel.query(
                `UPDATE expenses SET ${Object.keys(updateData).map(f => `${f} = ?`).join(', ')} WHERE id = ?`,
                [...Object.values(updateData), expenseId]
            );

            const [updatedExpense] = await ExpenseModel.findById(expenseId);
            return this.success(updatedExpense, 'Expense updated successfully');
        } catch (error) {
            console.error('Update expense error:', error);
            return this.error('Failed to update expense');
        }
    }
}

module.exports = new ExpenseService();