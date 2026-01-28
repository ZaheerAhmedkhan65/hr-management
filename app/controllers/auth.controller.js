//app/controllers/auth.controller.js
const AuthService = require('../services/auth.service');
const UserService = require('../services/user.service');
const ApplicationController = require('./application.controller');
const jwt = require('../../utils/jwt');
const passwordUtil = require('../../utils/password');

class AuthController extends ApplicationController {

    constructor() {
        super(AuthService);
        this.userService = UserService;

        // Bind to preserve context
        this.bindMethods();
    }

    bindMethods() {
        const methods = [
            'register', 'login', 'getProfile', 'updateProfile',
            'updateProfilePhoto', 'changePassword', 'forgotPassword',
            'resetPassword', 'verifyEmail', 'logout', 'extractRegistrationData'
        ];

        methods.forEach(method => {
            if (this[method]) {
                this[method] = this[method].bind(this);
            }
        });
    }

    // Register new company and admin user
    async register(req, res) {
        try {
            const { companyData, adminData } = this.extractRegistrationData(req.body);

            const result = await this.service.register(companyData, adminData);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            // Set token cookie
            res.cookie('token', result.data.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 24 * 60 * 60 * 1000 // 1 day
            });

            // For API requests, return JSON
            if (req.xhr || req.headers.accept?.includes('application/json')) {
                return this.success(res, result.data, result.message);
            }

            // For web requests, redirect to dashboard
            req.flash('success_msg', result.message);
            return res.redirect('/dashboard');

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Login user
    async login(req, res) {
        try {
            const { email, password } = req.body;

            const result = await this.service.login(email, password);

            if (!result.success) {
                // For web requests
                if (!req.xhr && !req.headers.accept?.includes('application/json')) {
                    req.flash('error_msg', result.message);
                    req.flash('old_input', req.body);
                    return res.redirect('/auth/login');
                }
                return this.error(res, result.message, 401);
            }

            // Set token cookie
            res.cookie('token', result.data.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 24 * 60 * 60 * 1000 // 1 day
            });

            // For API requests
            if (req.xhr || req.headers.accept?.includes('application/json')) {
                return this.success(res, result.data, result.message);
            }

            // For web requests
            req.flash('success_msg', 'Login successful!');
            return res.redirect('/dashboard');

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Get user profile
    async getProfile(req, res) {
        try {
            const userId = req.user.id;

            const result = await this.service.getProfile(userId);

            if (!result.success) {
                return this.error(res, result.message, 404);
            }

            // For web requests, render profile page
            if (!req.xhr && !req.headers.accept?.includes('application/json')) {
                return res.render('auth/profile', {
                    title: 'My Profile',
                    user: result.data
                });
            }

            return this.success(res, result.data, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Update user profile
    async updateProfile(req, res) {
        try {
            const userId = req.user.id;
            const profileData = req.body;

            // Handle profile image upload
            if (req.file) {
                profileData.profile_image = this.handleFileUpload(req);
            }

            const result = await this.service.updateProfile(userId, profileData);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            // Update user in session
            req.user = { ...req.user, ...profileData };

            if (!req.xhr && !req.headers.accept?.includes('application/json')) {
                req.flash('success_msg', result.message);
                return res.redirect('/auth/profile');
            }

            return this.success(res, result.data, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Update profile photo
    async updateProfilePhoto(req, res) {
        try {
            const userId = req.user.id;

            if (!req.file) {
                return this.error(res, 'No file uploaded', 400);
            }

            const profileImage = this.handleFileUpload(req);
            const result = await this.service.updateProfile(userId, { profile_image: profileImage });

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            // Update user in session
            req.user.profile_image = profileImage;

            return this.success(res, { profile_image: profileImage }, 'Profile photo updated');

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Change password
    async changePassword(req, res) {
        try {
            const userId = req.user.id;
            const { current_password, new_password } = req.body;

            const result = await this.service.changePassword(userId, current_password, new_password);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            if (!req.xhr && !req.headers.accept?.includes('application/json')) {
                req.flash('success_msg', result.message);
                return res.redirect('/auth/profile');
            }

            return this.success(res, null, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Forgot password
    async forgotPassword(req, res) {
        try {
            const { email } = req.body;

            const result = await this.service.forgotPassword(email);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            if (!req.xhr && !req.headers.accept?.includes('application/json')) {
                req.flash('success_msg', result.message);
                return res.redirect('/auth/login');
            }

            return this.success(res, null, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Reset password
    async resetPassword(req, res) {
        try {
            const { token, new_password } = req.body;

            const result = await this.service.resetPassword(token, new_password);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            if (!req.xhr && !req.headers.accept?.includes('application/json')) {
                req.flash('success_msg', result.message);
                return res.redirect('/auth/login');
            }

            return this.success(res, null, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Verify email
    async verifyEmail(req, res) {
        try {
            const { token } = req.params;

            // Decode token
            const decoded = jwt.verify(token);

            if (!decoded || decoded.type !== 'email_verification') {
                req.flash('error_msg', 'Invalid or expired verification token');
                return res.redirect('/auth/login');
            }

            // Update user email verification status
            await this.userService.update(decoded.id, { email_verified: true });

            req.flash('success_msg', 'Email verified successfully!');
            return res.redirect('/auth/login');

        } catch (error) {
            req.flash('error_msg', 'Failed to verify email');
            return res.redirect('/auth/login');
        }
    }

    // Logout
    async logout(req, res) {
        try {
            // Clear token cookie
            res.clearCookie('token');

            // Destroy session
            req.session.destroy();

            if (req.xhr || req.headers.accept?.includes('application/json')) {
                return this.success(res, null, 'Logged out successfully');
            }

            req.flash('success_msg', 'Logged out successfully');
            return res.redirect('/auth/login');

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Helper method to extract registration data
    extractRegistrationData(body) {
        const companyData = {
            company_name: body.company_name,
            company_email: body.company_email,
            company_phone: body.company_phone,
            address: body.address,
            industry: body.industry,
            tax_id: body.tax_id,
            registration_number: body.registration_number
        };

        const adminData = {
            first_name: body.first_name,
            last_name: body.last_name,
            email: body.email,
            password: body.password,
            phone: body.phone,
            address: body.admin_address || body.address
        };

        return { companyData, adminData };
    }
}

module.exports = new AuthController();