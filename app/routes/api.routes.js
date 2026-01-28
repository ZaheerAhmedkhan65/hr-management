//app/routes/api.routes.js
const router = require('./baseRouter.routes')();
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const companyRoutes = require('./company.routes');
const attendanceRoutes = require('./attendance.routes');
const leaveRoutes = require('./leave.routes');
const expenseRoutes = require('./expense.routes');
const salaryRoutes = require('./salary.routes');
const departmentRoutes = require('./department.routes');
const dashboardRoutes = require('./dashboard.routes');
const reportRoutes = require('./report.routes');

// API versioning
const apiPrefix = '/v1';

// Mount all API routes with version prefix
router.use(`${apiPrefix}/auth`, authRoutes);
router.use(`${apiPrefix}/users`, userRoutes);
router.use(`${apiPrefix}/companies`, companyRoutes);
router.use(`${apiPrefix}/attendance`, attendanceRoutes);
router.use(`${apiPrefix}/leaves`, leaveRoutes);
router.use(`${apiPrefix}/expenses`, expenseRoutes);
router.use(`${apiPrefix}/salaries`, salaryRoutes);
router.use(`${apiPrefix}/departments`, departmentRoutes);
router.use(`${apiPrefix}/dashboard`, dashboardRoutes);
router.use(`${apiPrefix}/reports`, reportRoutes);

// API documentation
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'HR Management System API',
        version: '1.0.0',
        endpoints: {
            auth: `${apiPrefix}/auth`,
            users: `${apiPrefix}/users`,
            companies: `${apiPrefix}/companies`,
            attendance: `${apiPrefix}/attendance`,
            leaves: `${apiPrefix}/leaves`,
            expenses: `${apiPrefix}/expenses`,
            salaries: `${apiPrefix}/salaries`,
            departments: `${apiPrefix}/departments`,
            dashboard: `${apiPrefix}/dashboard`,
            reports: `${apiPrefix}/reports`
        },
        documentation: '/api-docs',
        status: 'operational'
    });
});

// API documentation (Swagger/OpenAPI)
router.get('/docs', (req, res) => {
    res.json({
        success: true,
        message: 'API Documentation',
        swagger: '/api-docs/swagger.json',
        openapi: '/api-docs/openapi.json',
        postman: '/api-docs/postman.json'
    });
});

// API health check
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'API is healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version
    });
});

module.exports = router;