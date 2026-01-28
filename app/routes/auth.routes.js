// app/routes/auth.routes.js
const router = require('./baseRouter.routes')();
const AuthController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate');
const authValidation = require('../validations/auth.validation');
const { uploadProfile } = require('../middlewares/upload');

// Public routes (no authentication required)
router.post('/register', validate(authValidation.register), AuthController.register);
router.post('/login', validate(authValidation.login), AuthController.login);
router.post('/forgot-password', validate(authValidation.forgotPassword), AuthController.forgotPassword);
router.post('/reset-password', validate(authValidation.resetPassword), AuthController.resetPassword);

// Verify email (optional)
router.get('/verify-email/:token', AuthController.verifyEmail);

// Protected routes (authentication required)
router.get('/profile', AuthController.getProfile);
router.put('/profile',
    validate(authValidation.updateProfile),
    AuthController.updateProfile
);
router.put('/profile/photo',
    uploadProfile,
    AuthController.updateProfilePhoto
);
router.put('/change-password',
    validate(authValidation.changePassword),
    AuthController.changePassword
);
router.post('/logout', AuthController.logout);

// Web view routes
router.get('/login', (req, res) => {
    if (req.user) return res.redirect('/dashboard');
    res.render('auth/login', { title: 'Login', noFooter: true, noNavbar: true, noPageTitle: false });
});

router.get('/register', (req, res) => {
    if (req.user) return res.redirect('/dashboard');
    res.render('auth/register', { title: 'Register', noFooter: true, noNavbar: true, noPageTitle: false });
});

router.get('/forgot-password', (req, res) => {
    res.render('auth/forgot-password', { title: 'Forgot Password', noFooter: true, noNavbar: true, noPageTitle: false });
});

router.get('/reset-password/:token', (req, res) => {
    res.render('auth/reset-password', {
        title: 'Reset Password',
        token: req.params.token
    });
});

module.exports = router;