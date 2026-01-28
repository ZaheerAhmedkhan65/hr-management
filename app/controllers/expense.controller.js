//app/controllers/expense.controller.js
const ExpenseService = require('../services/expense.service');
const ApplicationController = require('./application.controller');

class ExpenseController extends ApplicationController {
    constructor() {
        super(ExpenseService);
    }

    // Submit expense
    async submitExpense(req, res) {
        try {
            const expenseData = req.body;
            expenseData.user_id = req.user.id;
            expenseData.company_id = req.user.companyId;

            // Handle receipt upload
            if (req.file) {
                expenseData.receipt_image = this.handleFileUpload(req);
            }

            const result = await this.service.submitExpense(expenseData, req.user.id);

            if (!result.success) {
                // For web requests
                if (!req.xhr && !req.headers.accept?.includes('application/json')) {
                    req.flash('error_msg', result.message);
                    req.flash('old_input', req.body);
                    return res.redirect('/expenses/submit');
                }
                return this.error(res, result.message, 400);
            }

            if (!req.xhr && !req.headers.accept?.includes('application/json')) {
                req.flash('success_msg', result.message);
                return res.redirect('/expenses/my');
            }

            return this.success(res, result.data, result.message, 201);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Get my expenses
    async getMyExpenses(req, res) {
        try {
            const userId = req.user.id;
            const filters = {
                status: req.query.status,
                start_date: req.query.start_date,
                end_date: req.query.end_date,
                expense_type: req.query.expense_type
            };

            const result = await this.service.getExpenses(userId);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            // Filter expenses if needed
            let expenses = result.data;
            if (filters.status && filters.status !== 'all') {
                expenses = expenses.filter(expense => expense.status === filters.status);
            }
            if (filters.expense_type) {
                expenses = expenses.filter(expense => expense.expense_type === filters.expense_type);
            }

            // Filter by date range
            if (filters.start_date && filters.end_date) {
                expenses = expenses.filter(expense => {
                    const expenseDate = new Date(expense.expense_date);
                    const startDate = new Date(filters.start_date);
                    const endDate = new Date(filters.end_date);
                    return expenseDate >= startDate && expenseDate <= endDate;
                });
            }

            // Calculate summary
            const summary = this.calculateExpenseSummary(expenses);

            // For web requests
            if (!req.xhr && !req.headers.accept?.includes('application/json')) {
                return res.render('expenses/my', {
                    title: 'My Expenses',
                    expenses: expenses,
                    summary: summary,
                    filters
                });
            }

            return this.success(res, { expenses, summary, filters }, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Get expense details
    async getExpenseDetails(req, res) {
        try {
            const expenseId = req.params.expenseId;

            const result = await this.service.getExpenseDetails(expenseId);

            if (!result.success) {
                return this.error(res, result.message, 404);
            }

            // Check permission
            if (!this.hasExpenseAccess(req.user, result.data)) {
                return this.error(res, 'Access denied', 403);
            }

            return this.success(res, result.data, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Get pending expenses (HR/Admin)
    async getPendingExpenses(req, res) {
        try {
            const companyId = req.user.companyId;

            const result = await this.service.getPendingExpenses(companyId);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            // For web requests
            if (!req.xhr && !req.headers.accept?.includes('application/json')) {
                return res.render('expenses/pending', {
                    title: 'Pending Expenses',
                    expenses: result.data
                });
            }

            return this.success(res, result.data, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Update expense status (HR/Admin)
    async updateExpenseStatus(req, res) {
        try {
            const expenseId = req.params.expenseId;
            const statusData = req.body;

            // Get expense details first to check permission
            const expenseDetails = await this.service.getExpenseDetails(expenseId);

            if (!expenseDetails.success) {
                return this.error(res, expenseDetails.message, 404);
            }

            // Check permission
            if (!this.canApproveExpense(req.user, expenseDetails.data)) {
                return this.error(res, 'Access denied', 403);
            }

            const result = await this.service.updateExpenseStatus(expenseId, statusData, req.user.id);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            return this.success(res, result.data, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Get company expenses (HR/Admin)
    async getCompanyExpenses(req, res) {
        try {
            const companyId = req.params.companyId || req.user.companyId;
            const filters = {
                status: req.query.status,
                start_date: req.query.start_date,
                end_date: req.query.end_date,
                expense_type: req.query.expense_type
            };

            // Check permission
            if (!this.hasCompanyAccess(req.user, companyId)) {
                return this.error(res, 'Access denied', 403);
            }

            const result = await this.service.getExpensesByDateRange(companyId, filters.start_date, filters.end_date);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            // Filter expenses if needed
            let expenses = result.data;
            if (filters.status && filters.status !== 'all') {
                expenses = expenses.filter(expense => expense.status === filters.status);
            }
            if (filters.expense_type) {
                expenses = expenses.filter(expense => expense.expense_type === filters.expense_type);
            }

            // Calculate summary
            const summary = this.calculateExpenseSummary(expenses);

            return this.success(res, { expenses, summary, filters }, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Get expense report
    async getExpenseReport(req, res) {
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

            const result = await this.service.getExpenseSummary(companyId, filters.start_date, filters.end_date);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            // For web requests
            if (!req.xhr && !req.headers.accept?.includes('application/json')) {
                return res.render('expenses/report', {
                    title: 'Expense Report',
                    report: result.data,
                    filters
                });
            }

            return this.success(res, result.data, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Get user expense report
    async getUserExpenseReport(req, res) {
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

            const expenses = await this.service.getExpenses(userId);

            if (!expenses.success) {
                return this.error(res, expenses.message, 400);
            }

            // Filter by date range
            let filteredExpenses = expenses.data;
            if (filters.start_date && filters.end_date) {
                filteredExpenses = filteredExpenses.filter(expense => {
                    const expenseDate = new Date(expense.expense_date);
                    const startDate = new Date(filters.start_date);
                    const endDate = new Date(filters.end_date);
                    return expenseDate >= startDate && expenseDate <= endDate;
                });
            }

            // Calculate summary
            const summary = this.calculateExpenseSummary(filteredExpenses);

            return this.success(res, { expenses: filteredExpenses, summary, filters }, 'Expense report generated');

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Get expense summary
    async getExpenseSummary(req, res) {
        try {
            const companyId = req.params.companyId || req.user.companyId;
            const { start_date, end_date } = req.query;

            // Check permission
            if (!this.hasCompanyAccess(req.user, companyId)) {
                return this.error(res, 'Access denied', 403);
            }

            const result = await this.service.getExpenseSummary(companyId, start_date, end_date);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            return this.success(res, result.data, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Get user expense summary
    async getUserExpenseSummary(req, res) {
        try {
            const userId = req.params.userId;
            const { start_date, end_date } = req.query;

            // Check permission
            if (!this.hasUserAccess(req.user, userId)) {
                return this.error(res, 'Access denied', 403);
            }

            const expenses = await this.service.getExpenses(userId);

            if (!expenses.success) {
                return this.error(res, expenses.message, 400);
            }

            // Filter by date range
            let filteredExpenses = expenses.data;
            if (start_date && end_date) {
                filteredExpenses = filteredExpenses.filter(expense => {
                    const expenseDate = new Date(expense.expense_date);
                    const startDate = new Date(start_date);
                    const endDate = new Date(end_date);
                    return expenseDate >= startDate && expenseDate <= endDate;
                });
            }

            // Calculate summary
            const summary = this.calculateExpenseSummary(filteredExpenses);

            return this.success(res, summary, 'Expense summary generated');

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Update expense
    async updateExpense(req, res) {
        try {
            const expenseId = req.params.expenseId;
            const expenseData = req.body;

            // Handle receipt upload
            if (req.file) {
                expenseData.receipt_image = this.handleFileUpload(req);
            }

            // Get expense details first to check permission
            const expenseDetails = await this.service.getExpenseDetails(expenseId);

            if (!expenseDetails.success) {
                return this.error(res, expenseDetails.message, 404);
            }

            // Check permission
            if (!this.canUpdateExpense(req.user, expenseDetails.data)) {
                return this.error(res, 'Access denied', 403);
            }

            const result = await this.service.updateExpense(expenseId, expenseData, req.user.id);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            return this.success(res, result.data, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Get expense categories (Admin)
    async getExpenseCategories(req, res) {
        try {
            // This would typically come from a database
            const categories = [
                { id: 1, name: 'Travel', description: 'Transportation and travel expenses' },
                { id: 2, name: 'Meals', description: 'Food and beverage expenses' },
                { id: 3, name: 'Office Supplies', description: 'Stationery and office materials' },
                { id: 4, name: 'Equipment', description: 'Office equipment and electronics' },
                { id: 5, name: 'Training', description: 'Courses and training materials' },
                { id: 6, name: 'Client Entertainment', description: 'Entertaining clients' },
                { id: 7, name: 'Utilities', description: 'Electricity, internet, phone bills' },
                { id: 8, name: 'Other', description: 'Miscellaneous expenses' }
            ];

            return this.success(res, categories, 'Expense categories retrieved');

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Create expense category (Admin)
    async createExpenseCategory(req, res) {
        try {
            const categoryData = req.body;

            // Validate data
            if (!categoryData.name) {
                return this.error(res, 'Category name is required', 400);
            }

            // This would typically save to database
            const newCategory = {
                id: Date.now(),
                ...categoryData,
                created_at: new Date()
            };

            return this.success(res, newCategory, 'Expense category created', 201);

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

    hasExpenseAccess(currentUser, expense) {
        if (currentUser.role === 'admin') return true;
        if (currentUser.role === 'hr' && currentUser.companyId === expense.company_id) return true;
        if (currentUser.id === expense.user_id) return true;
        return false;
    }

    canApproveExpense(currentUser, expense) {
        if (currentUser.role === 'admin') return true;
        if (currentUser.role === 'hr' && currentUser.companyId === expense.company_id) return true;
        return false;
    }

    canUpdateExpense(currentUser, expense) {
        if (currentUser.role === 'admin') return true;
        if (currentUser.role === 'hr' && currentUser.companyId === expense.company_id) return true;
        if (currentUser.id === expense.user_id && expense.status === 'pending') return true;
        return false;
    }

    // Calculate expense summary
    calculateExpenseSummary(expenses) {
        const summary = {
            total_amount: 0,
            approved_amount: 0,
            pending_amount: 0,
            rejected_amount: 0,
            total_count: expenses.length,
            by_category: {}
        };

        expenses.forEach(expense => {
            const amount = parseFloat(expense.amount) || 0;
            summary.total_amount += amount;

            if (expense.status === 'approved') {
                summary.approved_amount += amount;
            } else if (expense.status === 'pending') {
                summary.pending_amount += amount;
            } else if (expense.status === 'rejected') {
                summary.rejected_amount += amount;
            }

            // Group by category
            const category = expense.expense_type || 'Other';
            if (!summary.by_category[category]) {
                summary.by_category[category] = {
                    count: 0,
                    amount: 0
                };
            }
            summary.by_category[category].count++;
            summary.by_category[category].amount += amount;
        });

        return summary;
    }
}

module.exports = new ExpenseController();