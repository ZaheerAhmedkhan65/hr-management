//app/routes/expense.routes.js
const router = require('./baseRouter.routes')();
const ExpenseController = require('../controllers/expense.controller');
const validate = require('../middlewares/validate');
const expenseValidation = require('../validations/expense.validation');
const { authorize } = require('../middlewares/authorize');
const { isCompanyMember } = require('../middlewares/authorize');
const { uploadReceipt } = require('../middlewares/upload');
const { activityLogger } = require('../middlewares/logger');

// Employee self-service routes
router.post('/submit',
    authorize('employee', 'hr', 'admin'),
    validate(expenseValidation.submitExpense),
    uploadReceipt,
    activityLogger('submit_expense'),
    ExpenseController.submitExpense
);

router.get('/my-expenses',
    authorize('employee', 'hr', 'admin'),
    validate(expenseValidation.getExpenses, 'query'),
    activityLogger('view_my_expenses'),
    ExpenseController.getMyExpenses
);

router.put('/:expenseId',
    authorize('employee', 'hr', 'admin'),
    validate(expenseValidation.updateExpense),
    uploadReceipt,
    activityLogger('update_expense'),
    ExpenseController.updateExpense
);

// HR/Admin management routes
router.get('/pending',
    authorize('hr', 'admin'),
    activityLogger('view_pending_expenses'),
    ExpenseController.getPendingExpenses
);

router.put('/:expenseId/status',
    authorize('hr', 'admin'),
    validate(expenseValidation.updateStatus),
    activityLogger('update_expense_status'),
    ExpenseController.updateExpenseStatus
);

router.get('/company/:companyId',
    authorize('hr', 'admin'),
    isCompanyMember,
    validate(expenseValidation.getExpenses, 'query'),
    activityLogger('view_company_expenses'),
    ExpenseController.getCompanyExpenses
);

// Report routes
router.get('/reports/company/:companyId',
    authorize('hr', 'admin'),
    isCompanyMember,
    activityLogger('generate_expense_report'),
    ExpenseController.getExpenseReport
);

router.get('/reports/user/:userId',
    authorize('employee', 'hr', 'admin'),
    activityLogger('generate_user_expense_report'),
    ExpenseController.getUserExpenseReport
);

// Summary routes
router.get('/summary/company/:companyId',
    authorize('hr', 'admin'),
    isCompanyMember,
    activityLogger('view_expense_summary'),
    ExpenseController.getExpenseSummary
);

router.get('/summary/user/:userId',
    authorize('employee', 'hr', 'admin'),
    activityLogger('view_user_expense_summary'),
    ExpenseController.getUserExpenseSummary
);

// Expense categories (Admin)
router.get('/categories',
    authorize('admin'),
    activityLogger('view_expense_categories'),
    ExpenseController.getExpenseCategories
);

router.post('/categories',
    authorize('admin'),
    activityLogger('create_expense_category'),
    ExpenseController.createExpenseCategory
);

// Web view routes
router.get('/my', authorize('employee', 'hr', 'admin'), (req, res) => {
    res.render('expenses/my', {
        title: 'My Expenses',
        userId: req.user.id
    });
});

router.get('/submit', authorize('employee', 'hr', 'admin'), (req, res) => {
    res.render('expenses/submit', {
        title: 'Submit Expense',
        userId: req.user.id
    });
});

router.get('/pending', authorize('hr', 'admin'), (req, res) => {
    res.render('expenses/pending', {
        title: 'Pending Expenses',
        companyId: req.user.companyId
    });
});

router.get('/reports', authorize('hr', 'admin'), (req, res) => {
    res.render('expenses/reports', {
        title: 'Expense Reports',
        companyId: req.user.companyId
    });
});

module.exports = router;