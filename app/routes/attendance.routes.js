//app/routes/attendance.routes.js
const router = require('./baseRouter.routes')();
const AttendanceController = require('../controllers/attendance.controller');
const validate = require('../middlewares/validate');
const attendanceValidation = require('../validations/attendance.validation');
const { authorize } = require('../middlewares/authorize');
const { isCompanyMember } = require('../middlewares/authorize');
const { activityLogger } = require('../middlewares/logger');

// Employee self-service routes
router.post('/check-in',
    authorize('employee', 'hr', 'admin'),
    validate(attendanceValidation.checkIn),
    activityLogger('check_in'),
    AttendanceController.checkIn
);

router.post('/check-out/:attendanceId',
    authorize('employee', 'hr', 'admin'),
    validate(attendanceValidation.checkOut),
    activityLogger('check_out'),
    AttendanceController.checkOut
);

router.get('/my-attendance',
    authorize('employee', 'hr', 'admin'),
    validate(attendanceValidation.getAttendance, 'query'),
    activityLogger('view_my_attendance'),
    AttendanceController.getMyAttendance
);

// HR/Admin management routes
router.post('/mark',
    authorize('hr', 'admin'),
    validate(attendanceValidation.markAttendance),
    activityLogger('mark_attendance'),
    AttendanceController.markAttendance
);

router.put('/:attendanceId/status',
    authorize('hr', 'admin'),
    validate(attendanceValidation.updateStatus),
    activityLogger('update_attendance_status'),
    AttendanceController.updateAttendanceStatus
);

router.get('/company/:companyId',
    authorize('hr', 'admin'),
    isCompanyMember,
    activityLogger('view_company_attendance'),
    AttendanceController.getCompanyAttendance
);

router.get('/user/:userId',
    authorize('hr', 'admin'),
    activityLogger('view_user_attendance'),
    AttendanceController.getUserAttendance
);

// Report routes
router.get('/reports/company/:companyId',
    authorize('hr', 'admin'),
    isCompanyMember,
    validate(attendanceValidation.getReport, 'query'),
    activityLogger('generate_attendance_report'),
    AttendanceController.getAttendanceReport
);

router.get('/reports/user/:userId',
    authorize('employee', 'hr', 'admin'),
    validate(attendanceValidation.getReport, 'query'),
    activityLogger('generate_user_attendance_report'),
    AttendanceController.getUserAttendanceReport
);

// Summary routes
router.get('/summary/user/:userId',
    authorize('employee', 'hr', 'admin'),
    activityLogger('view_attendance_summary'),
    AttendanceController.getAttendanceSummary
);

router.get('/summary/company/:companyId',
    authorize('hr', 'admin'),
    isCompanyMember,
    activityLogger('view_company_attendance_summary'),
    AttendanceController.getCompanyAttendanceSummary
);

// Web view routes
router.get('/my', authorize('employee', 'hr', 'admin'), (req, res) => {
    res.render('attendance/my', {
        title: 'My Attendance',
        userId: req.user.id
    });
});

router.get('/company', authorize('hr', 'admin'), (req, res) => {
    res.render('attendance/company', {
        title: 'Company Attendance',
        companyId: req.user.companyId
    });
});

router.get('/reports', authorize('hr', 'admin'), (req, res) => {
    res.render('attendance/reports', {
        title: 'Attendance Reports',
        companyId: req.user.companyId
    });
});

module.exports = router;