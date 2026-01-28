//app/routes/dashboard.routes.js
const router = require('./baseRouter.routes')();
const DashboardController = require('../controllers/dashboard.controller');
const { authorize } = require('../middlewares/authorize');
const { activityLogger } = require('../middlewares/logger');

// Admin dashboard
router.get('/admin',
    authorize('admin'),
    activityLogger('view_admin_dashboard'),
    DashboardController.getAdminDashboard
);

// HR dashboard
router.get('/hr',
    authorize('hr'),
    activityLogger('view_hr_dashboard'),
    DashboardController.getHRDashboard
);

// Employee dashboard
router.get('/employee',
    authorize('employee'),
    activityLogger('view_employee_dashboard'),
    DashboardController.getEmployeeDashboard
);

// Analytics data
router.get('/analytics',
    authorize('admin', 'hr'),
    activityLogger('view_analytics'),
    DashboardController.getAnalytics
);

// Statistics
router.get('/stats',
    authorize('admin', 'hr'),
    activityLogger('view_dashboard_stats'),
    DashboardController.getDashboardStats
);

// Recent activities
router.get('/activities',
    authorize('admin', 'hr', 'employee'),
    activityLogger('view_recent_activities'),
    DashboardController.getRecentActivities
);

// Notifications
router.get('/notifications',
    authorize('admin', 'hr', 'employee'),
    DashboardController.getNotifications
);

router.put('/notifications/:notificationId/read',
    authorize('admin', 'hr', 'employee'),
    DashboardController.markNotificationRead
);

// Web view routes
router.get('/', (req, res) => {
    if (!req.user) {
        return res.redirect('/auth/login');
    }

    // Redirect based on role
    switch (req.user.role) {
        case 'admin':
            return res.redirect('/dashboard/admin');
        case 'hr':
            return res.redirect('/dashboard/hr');
        case 'employee':
            return res.redirect('/dashboard/employee');
        default:
            return res.redirect('/auth/login');
    }
});

router.get('/admin-view', authorize('admin'), (req, res) => {
    res.render('dashboard/admin', {
        title: 'Admin Dashboard',
        role: 'admin'
    });
});

router.get('/hr-view', authorize('hr'), (req, res) => {
    res.render('dashboard/hr', {
        title: 'HR Dashboard',
        role: 'hr'
    });
});

router.get('/employee-view', authorize('employee'), (req, res) => {
    res.render('dashboard/employee', {
        title: 'Employee Dashboard',
        role: 'employee'
    });
});

module.exports = router;