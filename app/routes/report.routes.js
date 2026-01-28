//app/routes/report.routes.js
const router = require('./baseRouter.routes')();
const ReportController = require('../controllers/report.controller');
const { authorize } = require('../middlewares/authorize');
const { isCompanyMember } = require('../middlewares/authorize');
const { activityLogger } = require('../middlewares/logger');

// Attendance reports
router.get('/attendance/company/:companyId',
    authorize('hr', 'admin'),
    isCompanyMember,
    activityLogger('generate_attendance_report'),
    ReportController.generateAttendanceReport
);

router.get('/attendance/user/:userId',
    authorize('employee', 'hr', 'admin'),
    activityLogger('generate_user_attendance_report'),
    ReportController.generateUserAttendanceReport
);

// Leave reports
router.get('/leave/company/:companyId',
    authorize('hr', 'admin'),
    isCompanyMember,
    activityLogger('generate_leave_report'),
    ReportController.generateLeaveReport
);

// Expense reports
router.get('/expense/company/:companyId',
    authorize('hr', 'admin'),
    isCompanyMember,
    activityLogger('generate_expense_report'),
    ReportController.generateExpenseReport
);

// Salary reports
router.get('/salary/company/:companyId',
    authorize('hr', 'admin'),
    isCompanyMember,
    activityLogger('generate_salary_report'),
    ReportController.generateSalaryReport
);

// User reports
router.get('/user/company/:companyId',
    authorize('hr', 'admin'),
    isCompanyMember,
    activityLogger('generate_user_report'),
    ReportController.generateUserReport
);

// Department reports
router.get('/department/company/:companyId',
    authorize('hr', 'admin'),
    isCompanyMember,
    activityLogger('generate_department_report'),
    ReportController.generateDepartmentReport
);

// Custom report generator
router.post('/custom',
    authorize('hr', 'admin'),
    activityLogger('generate_custom_report'),
    ReportController.generateCustomReport
);

// Report templates (Admin)
router.get('/templates',
    authorize('admin'),
    activityLogger('view_report_templates'),
    ReportController.getReportTemplates
);

router.post('/templates',
    authorize('admin'),
    activityLogger('create_report_template'),
    ReportController.createReportTemplate
);

// Export reports
router.get('/export/:reportId',
    authorize('admin', 'hr'),
    activityLogger('export_report'),
    ReportController.exportReport
);

// Web view routes
router.get('/attendance', authorize('hr', 'admin'), (req, res) => {
    res.render('reports/attendance', {
        title: 'Attendance Reports',
        companyId: req.user.companyId
    });
});

router.get('/leave', authorize('hr', 'admin'), (req, res) => {
    res.render('reports/leave', {
        title: 'Leave Reports',
        companyId: req.user.companyId
    });
});

router.get('/expense', authorize('hr', 'admin'), (req, res) => {
    res.render('reports/expense', {
        title: 'Expense Reports',
        companyId: req.user.companyId
    });
});

router.get('/salary', authorize('hr', 'admin'), (req, res) => {
    res.render('reports/salary', {
        title: 'Salary Reports',
        companyId: req.user.companyId
    });
});

router.get('/custom', authorize('hr', 'admin'), (req, res) => {
    res.render('reports/custom', {
        title: 'Custom Reports',
        companyId: req.user.companyId
    });
});

module.exports = router;