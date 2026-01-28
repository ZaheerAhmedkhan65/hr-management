//app/routes/public.routes.js
const router = require('./baseRouter.routes')();
const PublicController = require('../controllers/public.controller');

// Home page
router.get('/', PublicController.home);

// About page
router.get('/about', PublicController.about);

// Contact page
router.get('/contact', PublicController.contact);
router.post('/contact', PublicController.contactSubmit);

// Features page
router.get('/features', PublicController.features);

// Pricing page
router.get('/pricing', PublicController.pricing);

// FAQ page
router.get('/faq', PublicController.faq);

// Privacy policy
router.get('/privacy', PublicController.privacy);

// Terms of service
router.get('/terms', PublicController.terms);

// System status
router.get('/status', PublicController.status);

// Sitemap
router.get('/sitemap.xml', PublicController.sitemap);

// Robots.txt
router.get('/robots.txt', PublicController.robots);

// Health check
router.get('/health', PublicController.health);

// File uploads (public access to uploaded files with security)
router.get('/uploads/:type/:filename', PublicController.serveFile);

// Error pages
router.get('/error/404', (req, res) => {
    res.status(404).render('error/404', {
        title: 'Page Not Found',
        message: 'The page you are looking for does not exist.'
    });
});

router.get('/error/500', (req, res) => {
    res.status(500).render('error/500', {
        title: 'Server Error',
        message: 'An unexpected error occurred. Please try again later.'
    });
});

module.exports = router;