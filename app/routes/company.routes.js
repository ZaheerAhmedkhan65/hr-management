//app/routes/company.routes.js
const router = require('./baseRouter.routes')();
const CompanyController = require('../controllers/company.controller');
const validate = require('../middlewares/validate');
const companyValidation = require('../validations/company.validation');
const { authorize } = require('../middlewares/authorize');
const { isCompanyMember } = require('../middlewares/authorize');
const { activityLogger } = require('../middlewares/logger');

// Admin only routes
router.get('/',
    authorize('admin'),
    validate(companyValidation.searchCompanies, 'query'),
    activityLogger('view_companies'),
    CompanyController.getAllCompanies
);

router.post('/',
    authorize('admin'),
    validate(companyValidation.createCompany),
    activityLogger('create_company'),
    CompanyController.createCompany
);

router.get('/:companyId',
    authorize('admin'),
    activityLogger('view_company'),
    CompanyController.getCompany
);

router.put('/:companyId',
    authorize('admin'),
    validate(companyValidation.updateCompany),
    activityLogger('update_company'),
    CompanyController.updateCompany
);

router.delete('/:companyId',
    authorize('admin'),
    activityLogger('delete_company'),
    CompanyController.deleteCompany
);

router.put('/:companyId/status',
    authorize('admin'),
    validate(companyValidation.updateStatus),
    activityLogger('update_company_status'),
    CompanyController.updateCompanyStatus
);

router.put('/:companyId/subscription',
    authorize('admin'),
    validate(companyValidation.updateSubscription),
    activityLogger('update_company_subscription'),
    CompanyController.updateSubscription
);

// Company statistics (Admin)
router.get('/stats/summary',
    authorize('admin'),
    activityLogger('view_company_stats'),
    CompanyController.getCompanyStats
);

// Company-specific routes (Admin and Company members)
router.get('/:companyId/dashboard',
    authorize('admin', 'hr', 'employee'),
    isCompanyMember,
    CompanyController.getCompanyDashboard
);

router.get('/:companyId/reports',
    authorize('admin', 'hr'),
    isCompanyMember,
    CompanyController.getCompanyReports
);

// Web view routes
router.get('/list', authorize('admin'), (req, res) => {
    res.render('companies/list', { title: 'Companies' });
});

router.get('/create', authorize('admin'), (req, res) => {
    res.render('companies/create', { title: 'Create Company' });
});

router.get('/edit/:id', authorize('admin'), (req, res) => {
    res.render('companies/edit', {
        title: 'Edit Company',
        companyId: req.params.id
    });
});

router.get('/view/:id', authorize('admin'), (req, res) => {
    res.render('companies/view', {
        title: 'Company Details',
        companyId: req.params.id
    });
});

module.exports = router;