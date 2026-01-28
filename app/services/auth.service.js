// app/services/auth.service.js
const passwordUtil = require("../../utils/password");
const jwt = require('../../utils/jwt');
const UserModel = require('../models/user.model');
const CompanyModel = require('../models/company.model');
const ApplicationService = require('./application.service');

class AuthService extends ApplicationService {
    async login(email, password) {
        try {
            const [user] = await UserModel.findByEmail(email);
            if (!user) {
                return this.error('Invalid email or password');
            }

            if (user.status !== 'active') {
                return this.error('Account is inactive. Please contact administrator.');
            }

            const match = await passwordUtil.compare(password, user.password);
            if (!match) {
                return this.error('Invalid email or password');
            }

            // Get company details
            const [company] = await CompanyModel.findById(user.company_id);

            // Remove password from user object
            const { password: _, ...userWithoutPassword } = user;

            const token = jwt.sign({
                id: user.id,
                role: user.role,
                companyId: user.company_id
            });

            return this.success({
                token,
                user: userWithoutPassword,
                company: company || null
            }, 'Login successful');

        } catch (error) {
            console.error('Login error:', error);
            return this.error('An error occurred during login');
        }
    }

    async register(companyData, adminData) {
        try {
            // Check if company email already exists
            const existingCompany = await CompanyModel.findByEmail(companyData.company_email);
            if (existingCompany.length > 0) {
                return this.error('Company email already registered');
            }

            // Check if user email already exists
            const existingUser = await UserModel.findByEmail(adminData.email);
            if (existingUser.length > 0) {
                return this.error('User email already registered');
            }

            // Hash admin password
            const hashedPassword = await passwordUtil.hash(adminData.password);

            // Start transaction (if using transactions)
            // Create company
            const companyResult = await CompanyModel.create(companyData);
            const companyId = companyResult.insertId;

            // Create admin user
            const userData = {
                company_id: companyId,
                first_name: adminData.first_name,
                last_name: adminData.last_name,
                email: adminData.email,
                password: hashedPassword,
                phone: adminData.phone,
                address: adminData.address,
                role: 'admin',
                position: 'Administrator',
                hire_date: new Date(),
                status: 'active'
            };

            const userResult = await UserModel.create(userData);
            const userId = userResult.insertId;

            // Get created user without password
            const [newUser] = await UserModel.findById(userId);
            const { password: _, ...userWithoutPassword } = newUser;

            const token = jwt.sign({
                id: userId,
                role: 'admin',
                companyId: companyId
            });

            return this.success({
                token,
                user: userWithoutPassword,
                company: { id: companyId, ...companyData }
            }, 'Registration successful');

        } catch (error) {
            console.error('Registration error:', error);
            return this.error('Registration failed. Please try again.');
        }
    }

    async changePassword(userId, currentPassword, newPassword) {
        try {
            const [user] = await UserModel.findById(userId);
            if (!user) {
                return this.error('User not found');
            }

            const match = await passwordUtil.compare(currentPassword, user.password);
            if (!match) {
                return this.error('Current password is incorrect');
            }

            const hashedPassword = await passwordUtil.hash(newPassword);
            await UserModel.updatePassword(userId, hashedPassword);

            return this.success(null, 'Password changed successfully');
        } catch (error) {
            console.error('Change password error:', error);
            return this.error('Failed to change password');
        }
    }

    async forgotPassword(email) {
        try {
            const [user] = await UserModel.findByEmail(email);
            if (!user) {
                // Return success even if user not found (security best practice)
                return this.success(null, 'If an account exists, a reset link will be sent');
            }

            // Generate reset token (expires in 1 hour)
            const resetToken = jwt.sign({
                id: user.id,
                type: 'password_reset'
            }, '1h');

            // In production: Send email with reset link
            // await emailService.sendPasswordReset(email, resetToken);

            return this.success({ resetToken }, 'Password reset instructions sent');
        } catch (error) {
            console.error('Forgot password error:', error);
            return this.error('Failed to process request');
        }
    }

    async resetPassword(token, newPassword) {
        try {
            const decoded = jwt.verify(token);
            if (!decoded || decoded.type !== 'password_reset') {
                return this.error('Invalid or expired reset token');
            }

            const hashedPassword = await passwordUtil.hash(newPassword);
            await UserModel.updatePassword(decoded.id, hashedPassword);

            return this.success(null, 'Password reset successful');
        } catch (error) {
            console.error('Reset password error:', error);
            return this.error('Invalid or expired reset token');
        }
    }

    async getProfile(userId) {
        try {
            const [user] = await UserModel.findById(userId);
            if (!user) {
                return this.error('User not found');
            }

            const { password: _, ...userWithoutPassword } = user;
            return this.success(userWithoutPassword, 'Profile retrieved successfully');
        } catch (error) {
            console.error('Get profile error:', error);
            return this.error('Failed to retrieve profile');
        }
    }

    async updateProfile(userId, profileData) {
        try {
            await UserModel.updateProfile(userId, profileData);
            const [updatedUser] = await UserModel.findById(userId);

            const { password: _, ...userWithoutPassword } = updatedUser;
            return this.success(userWithoutPassword, 'Profile updated successfully');
        } catch (error) {
            console.error('Update profile error:', error);
            return this.error('Failed to update profile');
        }
    }
}

module.exports = new AuthService();