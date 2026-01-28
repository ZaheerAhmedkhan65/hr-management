//app/routes/salary.routes.js
const router = require('./baseRouter.routes')();
const SalaryController = require('../controllers/salary.controller');
const validate = require('../middlewares/validate');
const salaryValidation = require('../validations/salary.validation');
const { authorize } = require('../middlewares/authorize');
const { isCompanyMember } = require('../middlewares/authorize');
const { activityLogger } = require('../middlewares/logger');

// Employee routes
router.get('/my-salaries',
    authorize('employee', 'hr', 'admin'),
    validate(salaryValidation.getSalaries, 'query'),
    activityLogger('view_my_salaries'),
    SalaryController.getMySalaries
);

router.get('/my-salaries/:salaryId',
    authorize('employee', 'hr', 'admin'),
    activityLogger('view_my_salary_details'),
    SalaryController.getMySalaryDetails
);

// HR/Admin management routes
router.post('/generate',
    authorize('hr', 'admin'),
    validate(salaryValidation.generateSalary),
    activityLogger('generate_salary'),
    SalaryController.generateSalary
);

router.post('/bulk-generate',
    authorize('hr', 'admin'),
    validate(salaryValidation.bulkGenerate),
    activityLogger('bulk_generate_salaries'),
    SalaryController.bulkGenerateSalaries
);

router.put('/:salaryId',
    authorize('hr', 'admin'),
    validate(salaryValidation.updateSalary),
    activityLogger('update_salary'),
    SalaryController.updateSalary
);

router.put('/:salaryId/status',
    authorize('hr', 'admin'),
    validate(salaryValidation.updateStatus),
    activityLogger('update_salary_status'),
    SalaryController.updateSalaryStatus
);

router.get('/company/:companyId',
    authorize('hr', 'admin'),
    isCompanyMember,
    validate(salaryValidation.getSalaries, 'query'),
    activityLogger('view_company_salaries'),
    SalaryController.getCompanySalaries
);

// Report routes
router.get('/reports/company/:companyId',
    authorize('hr', 'admin'),
    isCompanyMember,
    activityLogger('generate_salary_report'),
    SalaryController.getSalaryReport
);

router.get('/reports/user/:userId',
    authorize('employee', 'hr', 'admin'),
    activityLogger('generate_user_salary_report'),
    SalaryController.getUserSalaryReport
);

// Summary routes
router.get('/summary/company/:companyId',
    authorize('hr', 'admin'),
    isCompanyMember,
    activityLogger('view_salary_summary'),
    SalaryController.getSalarySummary
);

router.get('/pending',
    authorize('hr', 'admin'),
    activityLogger('view_pending_salaries'),
    SalaryController.getPendingSalaries
);

// Payslip download
router.get('/payslip/:salaryId',
    authorize('employee', 'hr', 'admin'),
    activityLogger('download_payslip'),
    SalaryController.downloadPayslip
);

// Web view routes
router.get('/my', authorize('employee', 'hr', 'admin'), (req, res) => {
    res.render('salaries/my', {
        title: 'My Salaries',
        userId: req.user.id
    });
});

router.get('/company', authorize('hr', 'admin'), (req, res) => {
    res.render('salaries/company', {
        title: 'Company Salaries',
        companyId: req.user.companyId
    });
});

router.get('/generate', authorize('hr', 'admin'), (req, res) => {
    res.render('salaries/generate', {
        title: 'Generate Salary',
        companyId: req.user.companyId
    });
});

router.get('/reports', authorize('hr', 'admin'), (req, res) => {
    res.render('salaries/reports', {
        title: 'Salary Reports',
        companyId: req.user.companyId
    });
});

module.exports = router;