//app/services/user.service.js
const UserModel = require('../models/user.model');
const DepartmentModel = require('../models/department.model');
const passwordUtil = require("../../utils/password");
const ApplicationService = require('./application.service');

class UserService extends ApplicationService {
    async createUser(userData, createdBy) {
        try {
            // Check if email already exists
            const existingUser = await UserModel.findByEmail(userData.email);
            if (existingUser.length > 0) {
                return this.error('Email already registered');
            }

            // Hash password if provided
            if (userData.password) {
                userData.password = await passwordUtil.hash(userData.password);
            } else {
                // Generate temporary password
                const tempPassword = Math.random().toString(36).slice(-8);
                userData.password = await passwordUtil.hash(tempPassword);
                userData.temp_password = tempPassword; // For email notification
            }

            // Set default values
            userData.hire_date = userData.hire_date || new Date();
            userData.status = userData.status || 'active';

            const result = await UserModel.create(userData);
            const userId = result.insertId;

            const [newUser] = await UserModel.findById(userId);
            const { password: _, ...userWithoutPassword } = newUser;

            // In production: Send welcome email with credentials
            // await emailService.sendWelcomeEmail(userData.email, userData.temp_password);

            return this.success(userWithoutPassword, 'User created successfully');
        } catch (error) {
            console.error('Create user error:', error);
            return this.error('Failed to create user');
        }
    }

    async updateUser(userId, userData, updaterId) {
        try {
            // Check if user exists
            const [existingUser] = await UserModel.findById(userId);
            if (!existingUser) {
                return this.error('User not found');
            }

            // Prevent updating email to existing email
            if (userData.email && userData.email !== existingUser.email) {
                const emailExists = await UserModel.findByEmail(userData.email);
                if (emailExists.length > 0) {
                    return this.error('Email already in use');
                }
            }

            // Remove password from update if present (use separate endpoint for password)
            delete userData.password;

            await UserModel.update(userId, userData);
            const [updatedUser] = await UserModel.findById(userId);

            const { password: _, ...userWithoutPassword } = updatedUser;
            return this.success(userWithoutPassword, 'User updated successfully');
        } catch (error) {
            console.error('Update user error:', error);
            return this.error('Failed to update user');
        }
    }

    async deleteUser(userId, deleterId) {
        try {
            const [user] = await UserModel.findById(userId);
            if (!user) {
                return this.error('User not found');
            }

            // Prevent deleting self
            if (userId === deleterId) {
                return this.error('Cannot delete your own account');
            }

            // Soft delete (change status)
            await UserModel.delete(userId);
            return this.success(null, 'User deleted successfully');
        } catch (error) {
            console.error('Delete user error:', error);
            return this.error('Failed to delete user');
        }
    }

    async getUser(userId) {
        try {
            const [user] = await UserModel.findById(userId);
            if (!user) {
                return this.error('User not found');
            }

            const { password: _, ...userWithoutPassword } = user;

            // Get department info if exists
            if (user.department_id) {
                const [department] = await DepartmentModel.findById(user.department_id);
                userWithoutPassword.department = department || null;
            }

            return this.success(userWithoutPassword, 'User retrieved successfully');
        } catch (error) {
            console.error('Get user error:', error);
            return this.error('Failed to retrieve user');
        }
    }

    async getUsers(companyId, filters = {}) {
        try {
            let users;

            if (filters.search) {
                users = await UserModel.search(companyId, filters.search);
            } else if (filters.role) {
                users = await UserModel.findByRole(companyId, filters.role);
            } else if (filters.department) {
                users = await UserModel.query(
                    'SELECT * FROM users WHERE company_id = ? AND department_id = ? AND status = ? ORDER BY first_name',
                    [companyId, filters.department, 'active']
                );
            } else {
                users = await UserModel.findByCompany(companyId);
            }

            // Remove passwords from all users
            const usersWithoutPasswords = users.map(user => {
                const { password: _, ...userWithoutPassword } = user;
                return userWithoutPassword;
            });

            const total = users.length;
            return this.success({
                users: usersWithoutPasswords,
                total,
                page: filters.page || 1,
                limit: filters.limit || 20,
                pages: Math.ceil(total / (filters.limit || 20))
            }, 'Users retrieved successfully');
        } catch (error) {
            console.error('Get users error:', error);
            return this.error('Failed to retrieve users');
        }
    }

    async updateUserRole(userId, role, updaterId) {
        try {
            const [user] = await UserModel.findById(userId);
            if (!user) {
                return this.error('User not found');
            }

            const validRoles = ['admin', 'hr', 'employee'];
            if (!validRoles.includes(role)) {
                return this.error('Invalid role');
            }

            await UserModel.update(userId, { role });
            return this.success({ role }, 'User role updated successfully');
        } catch (error) {
            console.error('Update role error:', error);
            return this.error('Failed to update user role');
        }
    }

    async updateUserSalary(userId, salaryData, updaterId) {
        try {
            const [user] = await UserModel.findById(userId);
            if (!user) {
                return this.error('User not found');
            }

            const updateData = {};
            if (salaryData.salary !== undefined) updateData.salary = salaryData.salary;
            if (salaryData.bonus !== undefined) updateData.bonus = salaryData.bonus;

            await UserModel.update(userId, updateData);
            return this.success(updateData, 'Salary updated successfully');
        } catch (error) {
            console.error('Update salary error:', error);
            return this.error('Failed to update salary');
        }
    }

    async resetUserPassword(userId, newPassword, resetterId) {
        try {
            const [user] = await UserModel.findById(userId);
            if (!user) {
                return this.error('User not found');
            }

            const hashedPassword = await passwordUtil.hash(newPassword);
            await UserModel.updatePassword(userId, hashedPassword);

            return this.success(null, 'Password reset successfully');
        } catch (error) {
            console.error('Reset password error:', error);
            return this.error('Failed to reset password');
        }
    }

    async getUserStats(companyId) {
        try {
            const [totalEmployees] = await UserModel.countByRole(companyId, 'employee');
            const [totalHR] = await UserModel.countByRole(companyId, 'hr');
            const [totalAdmins] = await UserModel.countByRole(companyId, 'admin');
            const [activeUsers] = await UserModel.query(
                'SELECT COUNT(*) as count FROM users WHERE company_id = ? AND status = "active"',
                [companyId]
            );

            return this.success({
                total_employees: totalEmployees.count,
                total_hr: totalHR.count,
                total_admins: totalAdmins.count,
                active_users: activeUsers.count,
                inactive_users: totalEmployees.count + totalHR.count + totalAdmins.count - activeUsers.count
            }, 'Statistics retrieved successfully');
        } catch (error) {
            console.error('Get stats error:', error);
            return this.error('Failed to retrieve statistics');
        }
    }
}

module.exports = new UserService();