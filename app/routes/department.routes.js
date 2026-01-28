//app/routes/department.routes.js
const router = require('./baseRouter.routes')();
const DepartmentController = require('../controllers/department.controller');
const validate = require('../middlewares/validate');
const departmentValidation = require('../validations/department.validation');
const { authorize } = require('../middlewares/authorize');
const { isCompanyMember } = require('../middlewares/authorize');
const { activityLogger } = require('../middlewares/logger');

// Get all departments (Admin, HR)
router.get('/company/:companyId',
    authorize('admin', 'hr'),
    isCompanyMember,
    activityLogger('view_departments'),
    DepartmentController.getDepartments
);

// Get single department
router.get('/:departmentId',
    authorize('admin', 'hr'),
    activityLogger('view_department'),
    DepartmentController.getDepartment
);

// Create department (Admin, HR)
router.post('/',
    authorize('admin', 'hr'),
    validate(departmentValidation.createDepartment),
    activityLogger('create_department'),
    DepartmentController.createDepartment
);

// Update department (Admin, HR)
router.put('/:departmentId',
    authorize('admin', 'hr'),
    validate(departmentValidation.updateDepartment),
    activityLogger('update_department'),
    DepartmentController.updateDepartment
);

// Delete department (Admin only)
router.delete('/:departmentId',
    authorize('admin'),
    activityLogger('delete_department'),
    DepartmentController.deleteDepartment
);

// Update department manager (Admin, HR)
router.put('/:departmentId/manager',
    authorize('admin', 'hr'),
    validate(departmentValidation.updateManager),
    activityLogger('update_department_manager'),
    DepartmentController.updateDepartmentManager
);

// Reassign employees (Admin, HR)
router.post('/:departmentId/reassign',
    authorize('admin', 'hr'),
    validate(departmentValidation.reassignEmployees),
    activityLogger('reassign_employees'),
    DepartmentController.reassignEmployees
);

// Get department statistics
router.get('/:departmentId/stats',
    authorize('admin', 'hr'),
    activityLogger('view_department_stats'),
    DepartmentController.getDepartmentStats
);

// Web view routes
router.get('/list/company/:companyId', authorize('admin', 'hr'), (req, res) => {
    res.render('departments/list', {
        title: 'Departments',
        companyId: req.params.companyId
    });
});

router.get('/create/company/:companyId', authorize('admin', 'hr'), (req, res) => {
    res.render('departments/create', {
        title: 'Create Department',
        companyId: req.params.companyId
    });
});

router.get('/edit/:id', authorize('admin', 'hr'), (req, res) => {
    res.render('departments/edit', {
        title: 'Edit Department',
        departmentId: req.params.id
    });
});

router.get('/view/:id', authorize('admin', 'hr'), (req, res) => {
    res.render('departments/view', {
        title: 'Department Details',
        departmentId: req.params.id
    });
});

module.exports = router;