//app/routes/application.routes.js
const fs = require('fs');
const path = require('path');
const authenticate = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');

// Define public routes (no authentication required)
const publicRoutes = ['auth', 'public'];

// Define route mounts for specific paths
const routeMounts = {
    auth: '/auth',
    admin: '/admin',
    hr: '/hr',
    employee: '/employee',
    public: '/',
    api: '/api'
};

// Define route-specific middlewares
const routeMiddlewares = {
    admin: [authenticate, authorize('admin')],
    hr: [authenticate, authorize('hr', 'admin')],
    employee: [authenticate, authorize('employee', 'hr', 'admin')],
    api: [authenticate]
};

module.exports = (app) => {
    const routesPath = path.join(__dirname);
    const routeFiles = fs.readdirSync(routesPath).filter(f => f.endsWith('.routes.js') && f !== 'application.routes.js');

    console.log('\n🔗 Loading routes...');

    routeFiles.forEach(file => {
        const route = require(path.join(routesPath, file));
        const routeName = file.replace('.routes.js', '').toLowerCase();
        const routePath = routeMounts[routeName] || `/${routeName}`;

        console.log(`📁 Processing: ${file} -> ${routeName}`);

        // Apply middlewares based on route type
        if (publicRoutes.includes(routeName)) {
            app.use(routePath, route);
            console.log(`  ✅ Mounted as PUBLIC: ${routePath}`);
        } else if (routeMiddlewares[routeName]) {
            app.use(routePath, ...routeMiddlewares[routeName], route);
            console.log(`  ✅ Mounted with AUTH: ${routePath}`);
        } else {
            app.use(routePath, authenticate, route);
            console.log(`  ✅ Mounted with DEFAULT AUTH: ${routePath}`);
        }
    });

    console.log('✅ All routes loaded successfully!\n');

    // 404 handler for API routes
    app.use('/api', (req, res) => {
        res.status(404).json({
            success: false,
            message: 'API endpoint not found'
        });
    });


    // 404 handler for web routes
    // app.use('*', (req, res) => {
    //     if (req.xhr || req.headers.accept?.includes('application/json')) {
    //         return res.status(404).json({
    //             success: false,
    //             message: 'Endpoint not found'
    //         });
    //     }

    //     res.status(404).render('error/404', {
    //         title: 'Page Not Found',
    //         message: 'The page you are looking for does not exist.'
    //     });
    // });
};