//app/routes/leave.routes.js
const router = require('./baseRouter.routes')();
const LeaveController = require('../controllers/leave.controller');
const validate = require('../middlewares/validate');
const leaveValidation = require('../validations/leave.validation');
const { authorize } = require('../middlewares/authorize');
const { isCompanyMember } = require('../middlewares/authorize');
const { activityLogger } = require('../middlewares/logger');

// Employee self-service routes
router.post('/apply',
    authorize('employee', 'hr', 'admin'),
    validate(leaveValidation.applyLeave),
    activityLogger('apply_leave'),
    LeaveController.applyLeave
);

router.get('/my-leaves',
    authorize('employee', 'hr', 'admin'),
    validate(leaveValidation.getLeaves, 'query'),
    activityLogger('view_my_leaves'),
    LeaveController.getMyLeaves
);

router.delete('/:leaveId/cancel',
    authorize('employee', 'hr', 'admin'),
    activityLogger('cancel_leave'),
    LeaveController.cancelLeave
);

// HR/Admin management routes
router.get('/pending',
    authorize('hr', 'admin'),
    activityLogger('view_pending_leaves'),
    LeaveController.getPendingLeaves
);

router.put('/:leaveId/status',
    authorize('hr', 'admin'),
    validate(leaveValidation.updateStatus),
    activityLogger('update_leave_status'),
    LeaveController.updateLeaveStatus
);

router.get('/company/:companyId',
    authorize('hr', 'admin'),
    isCompanyMember,
    validate(leaveValidation.getLeaves, 'query'),
    activityLogger('view_company_leaves'),
    LeaveController.getCompanyLeaves
);

// Report routes
router.get('/reports/company/:companyId',
    authorize('hr', 'admin'),
    isCompanyMember,
    activityLogger('generate_leave_report'),
    LeaveController.getLeaveReport
);

// Summary routes
router.get('/summary/user/:userId',
    authorize('employee', 'hr', 'admin'),
    activityLogger('view_leave_summary'),
    LeaveController.getLeaveSummary
);

router.get('/summary/company/:companyId',
    authorize('hr', 'admin'),
    isCompanyMember,
    activityLogger('view_company_leave_summary'),
    LeaveController.getCompanyLeaveSummary
);

// Leave types management (Admin)
router.get('/types',
    authorize('admin'),
    activityLogger('view_leave_types'),
    LeaveController.getLeaveTypes
);

router.post('/types',
    authorize('admin'),
    activityLogger('create_leave_type'),
    LeaveController.createLeaveType
);

// Web view routes
router.get('/my', authorize('employee', 'hr', 'admin'), (req, res) => {
    res.render('leaves/my', {
        title: 'My Leaves',
        userId: req.user.id
    });
});

router.get('/apply', authorize('employee', 'hr', 'admin'), (req, res) => {
    res.render('leaves/apply', {
        title: 'Apply Leave',
        userId: req.user.id
    });
});

router.get('/pending', authorize('hr', 'admin'), (req, res) => {
    res.render('leaves/pending', {
        title: 'Pending Leaves',
        companyId: req.user.companyId
    });
});

router.get('/reports', authorize('hr', 'admin'), (req, res) => {
    res.render('leaves/reports', {
        title: 'Leave Reports',
        companyId: req.user.companyId
    });
});

module.exports = router;