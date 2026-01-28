//app/controllers/department.controller.js
const DepartmentService = require('../services/department.service');
const ApplicationController = require('./application.controller');

class DepartmentController extends ApplicationController {
    constructor() {
        super(DepartmentService);
    }

    // Get all departments for company
    async getDepartments(req, res) {
        try {
            const companyId = req.params.companyId || req.user.companyId;

            // Check permission
            if (!this.hasCompanyAccess(req.user, companyId)) {
                return this.error(res, 'Access denied', 403);
            }

            const result = await this.service.getDepartments(companyId);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            // For web requests
            if (!req.xhr && !req.headers.accept?.includes('application/json')) {
                return res.render('departments/list', {
                    title: 'Departments',
                    departments: result.data,
                    companyId: companyId
                });
            }

            return this.success(res, result.data, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Get single department
    async getDepartment(req, res) {
        try {
            const departmentId = req.params.departmentId;

            const result = await this.service.getDepartment(departmentId);

            if (!result.success) {
                return this.error(res, result.message, 404);
            }

            // Check permission
            if (!this.hasCompanyAccess(req.user, result.data.company_id)) {
                return this.error(res, 'Access denied', 403);
            }

            // For web requests
            if (!req.xhr && !req.headers.accept?.includes('application/json')) {
                return res.render('departments/view', {
                    title: 'Department Details',
                    department: result.data
                });
            }

            return this.success(res, result.data, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Create department
    async createDepartment(req, res) {
        try {
            const departmentData = req.body;
            departmentData.company_id = req.user.companyId;

            const result = await this.service.createDepartment(departmentData, req.user.id);

            if (!result.success) {
                // For web requests
                if (!req.xhr && !req.headers.accept?.includes('application/json')) {
                    req.flash('error_msg', result.message);
                    req.flash('old_input', req.body);
                    return res.redirect('/departments/create');
                }
                return this.error(res, result.message, 400);
            }

            if (!req.xhr && !req.headers.accept?.includes('application/json')) {
                req.flash('success_msg', result.message);
                return res.redirect(`/departments/view/${result.data.id}`);
            }

            return this.success(res, result.data, result.message, 201);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Update department
    async updateDepartment(req, res) {
        try {
            const departmentId = req.params.departmentId;
            const departmentData = req.body;

            // Get department first to check permission
            const department = await this.service.getDepartment(departmentId);

            if (!department.success) {
                return this.error(res, department.message, 404);
            }

            // Check permission
            if (!this.hasCompanyAccess(req.user, department.data.company_id)) {
                return this.error(res, 'Access denied', 403);
            }

            const result = await this.service.updateDepartment(departmentId, departmentData, req.user.id);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            if (!req.xhr && !req.headers.accept?.includes('application/json')) {
                req.flash('success_msg', result.message);
                return res.redirect(`/departments/view/${departmentId}`);
            }

            return this.success(res, result.data, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Delete department
    async deleteDepartment(req, res) {
        try {
            const departmentId = req.params.departmentId;

            // Get department first to check permission
            const department = await this.service.getDepartment(departmentId);

            if (!department.success) {
                return this.error(res, department.message, 404);
            }

            // Check permission
            if (!this.hasCompanyAccess(req.user, department.data.company_id)) {
                return this.error(res, 'Access denied', 403);
            }

            // Only admin can delete departments
            if (req.user.role !== 'admin') {
                return this.error(res, 'Only administrators can delete departments', 403);
            }

            const result = await this.service.deleteDepartment(departmentId, req.user.id);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            if (!req.xhr && !req.headers.accept?.includes('application/json')) {
                req.flash('success_msg', result.message);
                return res.redirect('/departments/list');
            }

            return this.success(res, null, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Update department manager
    async updateDepartmentManager(req, res) {
        try {
            const departmentId = req.params.departmentId;
            const { manager_id } = req.body;

            // Get department first to check permission
            const department = await this.service.getDepartment(departmentId);

            if (!department.success) {
                return this.error(res, department.message, 404);
            }

            // Check permission
            if (!this.hasCompanyAccess(req.user, department.data.company_id)) {
                return this.error(res, 'Access denied', 403);
            }

            const result = await this.service.updateDepartmentManager(departmentId, manager_id, req.user.id);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            return this.success(res, result.data, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Reassign employees
    async reassignEmployees(req, res) {
        try {
            const departmentId = req.params.departmentId;
            const { new_department_id } = req.body;

            // Get department first to check permission
            const department = await this.service.getDepartment(departmentId);

            if (!department.success) {
                return this.error(res, department.message, 404);
            }

            // Check permission
            if (!this.hasCompanyAccess(req.user, department.data.company_id)) {
                return this.error(res, 'Access denied', 403);
            }

            const result = await this.service.reassignEmployees(departmentId, new_department_id, req.user.id);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            return this.success(res, result.data, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Get department statistics
    async getDepartmentStats(req, res) {
        try {
            const departmentId = req.params.departmentId;

            // Get department first to check permission
            const department = await this.service.getDepartment(departmentId);

            if (!department.success) {
                return this.error(res, department.message, 404);
            }

            // Check permission
            if (!this.hasCompanyAccess(req.user, department.data.company_id)) {
                return this.error(res, 'Access denied', 403);
            }

            const result = await this.service.getDepartmentStats(departmentId);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            return this.success(res, result.data, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Helper methods for permissions
    hasCompanyAccess(currentUser, companyId) {
        if (currentUser.role === 'admin') return true;
        if (currentUser.companyId === parseInt(companyId)) return true;
        return false;
    }
}

module.exports = new DepartmentController();