//app/controllers/user.controller.js
const UserService = require('../services/user.service');
const ApplicationController = require('./application.controller');

class UserController extends ApplicationController {
    constructor() {
        super(UserService);
    }

    // Get all users
    async getAllUsers(req, res) {
        try {
            const { page, limit, offset } = this.paginate(req);
            const filters = {
                search: req.query.search,
                role: req.query.role,
                department: req.query.department,
                status: req.query.status,
                companyId: req.user.companyId
            };

            const result = await this.service.getUsers(filters.companyId, {
                ...filters,
                page,
                limit,
                offset
            });

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            // For web requests, render users list
            if (!req.xhr && !req.headers.accept?.includes('application/json')) {
                return res.render('users/list', {
                    title: 'Users',
                    users: result.data.users,
                    currentPage: page,
                    totalPages: result.data.pages,
                    query: req.query
                });
            }

            return this.success(res, result.data, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Get single user
    async getUser(req, res) {
        try {
            const userId = req.params.userId;

            const result = await this.service.getUser(userId);

            if (!result.success) {
                return this.error(res, result.message, 404);
            }

            // Check permission
            if (!this.hasUserAccess(req.user, result.data)) {
                return this.error(res, 'Access denied', 403);
            }

            // For web requests, render user profile
            if (!req.xhr && !req.headers.accept?.includes('application/json')) {
                return res.render('users/view', {
                    title: 'User Profile',
                    user: result.data
                });
            }

            return this.success(res, result.data, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Create new user
    async createUser(req, res) {
        try {
            const userData = req.body;
            userData.company_id = req.user.companyId;

            // Handle profile image upload
            if (req.file) {
                userData.profile_image = this.handleFileUpload(req);
            }

            // Set default values
            if (!userData.password) {
                userData.generate_password = true;
            }

            const result = await this.service.createUser(userData, req.user.id);

            if (!result.success) {
                // For web requests
                if (!req.xhr && !req.headers.accept?.includes('application/json')) {
                    req.flash('error_msg', result.message);
                    req.flash('old_input', req.body);
                    return res.redirect('/users/create');
                }
                return this.error(res, result.message, 400);
            }

            if (!req.xhr && !req.headers.accept?.includes('application/json')) {
                req.flash('success_msg', result.message);
                return res.redirect(`/users/view/${result.data.id}`);
            }

            return this.success(res, result.data, result.message, 201);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Update user
    async updateUser(req, res) {
        try {
            const userId = req.params.userId;
            const userData = req.body;

            // Handle profile image upload
            if (req.file) {
                userData.profile_image = this.handleFileUpload(req);
            }

            // Check permission
            if (!this.canUpdateUser(req.user, userId)) {
                return this.error(res, 'Access denied', 403);
            }

            const result = await this.service.updateUser(userId, userData, req.user.id);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            if (!req.xhr && !req.headers.accept?.includes('application/json')) {
                req.flash('success_msg', result.message);
                return res.redirect(`/users/view/${userId}`);
            }

            return this.success(res, result.data, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Delete user
    async deleteUser(req, res) {
        try {
            const userId = req.params.userId;

            // Check permission
            if (!this.canDeleteUser(req.user, userId)) {
                return this.error(res, 'Access denied', 403);
            }

            const result = await this.service.deleteUser(userId, req.user.id);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            if (!req.xhr && !req.headers.accept?.includes('application/json')) {
                req.flash('success_msg', result.message);
                return res.redirect('/users/list');
            }

            return this.success(res, null, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Update user role
    async updateUserRole(req, res) {
        try {
            const userId = req.params.userId;
            const { role } = req.body;

            // Only admin can update roles
            if (req.user.role !== 'admin') {
                return this.error(res, 'Access denied', 403);
            }

            const result = await this.service.updateUserRole(userId, role, req.user.id);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            return this.success(res, result.data, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Update user salary
    async updateUserSalary(req, res) {
        try {
            const userId = req.params.userId;
            const salaryData = req.body;

            // Check permission
            if (!this.canUpdateSalary(req.user, userId)) {
                return this.error(res, 'Access denied', 403);
            }

            const result = await this.service.updateUserSalary(userId, salaryData, req.user.id);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            return this.success(res, result.data, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Reset user password
    async resetUserPassword(req, res) {
        try {
            const userId = req.params.userId;
            const { new_password } = req.body;

            // Check permission
            if (!this.canResetPassword(req.user, userId)) {
                return this.error(res, 'Access denied', 403);
            }

            const result = await this.service.resetUserPassword(userId, new_password, req.user.id);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            return this.success(res, null, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Get user statistics
    async getUserStats(req, res) {
        try {
            const companyId = req.params.companyId || req.user.companyId;

            // Check permission
            if (!this.hasCompanyAccess(req.user, companyId)) {
                return this.error(res, 'Access denied', 403);
            }

            const result = await this.service.getUserStats(companyId);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            return this.success(res, result.data, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Export users
    async exportUsers(req, res) {
        try {
            const companyId = req.params.companyId;

            // Check permission
            if (!this.hasCompanyAccess(req.user, companyId)) {
                return this.error(res, 'Access denied', 403);
            }

            const filters = {
                department: req.query.department,
                role: req.query.role,
                status: req.query.status
            };

            const result = await this.service.getUsers(companyId, filters);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            // Generate CSV
            const csv = this.generateUsersCSV(result.data.users);

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=users-${Date.now()}.csv`);

            return res.send(csv);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Bulk upload users
    async bulkUploadUsers(req, res) {
        try {
            if (!req.file) {
                return this.error(res, 'No file uploaded', 400);
            }

            const companyId = req.user.companyId;
            const filePath = req.file.path;

            // Process CSV file
            const result = await this.service.processBulkUpload(companyId, filePath, req.user.id);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            return this.success(res, result.data, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Helper methods for permissions
    hasUserAccess(currentUser, targetUser) {
        if (currentUser.role === 'admin') return true;
        if (currentUser.role === 'hr' && currentUser.companyId === targetUser.company_id) return true;
        if (currentUser.id === targetUser.id) return true;
        return false;
    }

    canUpdateUser(currentUser, targetUserId) {
        if (currentUser.role === 'admin') return true;
        if (currentUser.role === 'hr') return true;
        if (currentUser.id === targetUserId) return true;
        return false;
    }

    canDeleteUser(currentUser, targetUserId) {
        if (currentUser.role === 'admin') return true;
        if (currentUser.role === 'hr') return true;
        return false;
    }

    canUpdateSalary(currentUser, targetUserId) {
        if (currentUser.role === 'admin') return true;
        if (currentUser.role === 'hr') return true;
        return false;
    }

    canResetPassword(currentUser, targetUserId) {
        if (currentUser.role === 'admin') return true;
        if (currentUser.role === 'hr') return true;
        if (currentUser.id === targetUserId) return true;
        return false;
    }

    hasCompanyAccess(currentUser, companyId) {
        if (currentUser.role === 'admin') return true;
        if (currentUser.companyId === companyId) return true;
        return false;
    }

    // Generate CSV from users
    generateUsersCSV(users) {
        const headers = ['ID', 'Name', 'Email', 'Phone', 'Department', 'Position', 'Role', 'Status', 'Join Date'];
        const rows = users.map(user => [
            user.id,
            `${user.first_name} ${user.last_name}`,
            user.email,
            user.phone || '',
            user.department_name || '',
            user.position || '',
            user.role,
            user.status,
            new Date(user.hire_date).toLocaleDateString()
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
}

module.exports = new UserController();