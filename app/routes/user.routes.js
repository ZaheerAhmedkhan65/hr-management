//app/routes/user.routes.js
const router = require('./baseRouter.routes')();
const UserController = require('../controllers/user.controller');
const validate = require('../middlewares/validate');
const userValidation = require('../validations/user.validation');
const { authorize, canAccessUser } = require('../middlewares/authorize');
const { uploadProfile } = require('../middlewares/upload');
const { activityLogger } = require('../middlewares/logger');

// All user routes require authentication
// Admin can access all, HR can access their company, Employee can access own

// Get all users (Admin, HR)
router.get('/',
    authorize('admin', 'hr'),
    validate(userValidation.searchUsers, 'query'),
    activityLogger('view_users'),
    UserController.getAllUsers
);

// Get user by ID
router.get('/:userId',
    canAccessUser,
    activityLogger('view_user'),
    UserController.getUser
);

// Create new user (Admin, HR)
router.post('/',
    authorize('admin', 'hr'),
    validate(userValidation.createUser),
    uploadProfile,
    activityLogger('create_user'),
    UserController.createUser
);

// Update user (Admin, HR, or self)
router.put('/:userId',
    canAccessUser,
    validate(userValidation.updateUser),
    uploadProfile,
    activityLogger('update_user'),
    UserController.updateUser
);

// Delete user (Admin, HR)
router.delete('/:userId',
    authorize('admin', 'hr'),
    activityLogger('delete_user'),
    UserController.deleteUser
);

// Update user role (Admin only)
router.put('/:userId/role',
    authorize('admin'),
    validate(userValidation.updateRole),
    activityLogger('update_user_role'),
    UserController.updateUserRole
);

// Update user salary (Admin, HR)
router.put('/:userId/salary',
    authorize('admin', 'hr'),
    validate(userValidation.updateSalary),
    activityLogger('update_user_salary'),
    UserController.updateUserSalary
);

// Reset user password (Admin, HR, or self)
router.put('/:userId/reset-password',
    canAccessUser,
    validate(userValidation.resetPassword),
    activityLogger('reset_user_password'),
    UserController.resetUserPassword
);

// Get user statistics (Admin, HR)
router.get('/stats/company/:companyId',
    authorize('admin', 'hr'),
    activityLogger('view_user_stats'),
    UserController.getUserStats
);

// Export users (Admin, HR)
router.get('/export/company/:companyId',
    authorize('admin', 'hr'),
    activityLogger('export_users'),
    UserController.exportUsers
);

// Bulk upload users (Admin, HR)
router.post('/bulk-upload',
    authorize('admin', 'hr'),
    activityLogger('bulk_upload_users'),
    UserController.bulkUploadUsers
);

// Web view routes
router.get('/list', authorize('admin', 'hr'), (req, res) => {
    res.render('users/list', {
        title: 'Users',
        role: req.user.role
    });
});

router.get('/create', authorize('admin', 'hr'), (req, res) => {
    res.render('users/create', {
        title: 'Create User',
        role: req.user.role
    });
});

router.get('/edit/:id', canAccessUser, (req, res) => {
    res.render('users/edit', {
        title: 'Edit User',
        userId: req.params.id
    });
});

router.get('/profile/:id', canAccessUser, (req, res) => {
    res.render('users/profile', {
        title: 'User Profile',
        userId: req.params.id
    });
});

module.exports = router;