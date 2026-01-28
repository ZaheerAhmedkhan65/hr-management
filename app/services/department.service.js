// app/services/department.service.js
const DepartmentModel = require('../models/department.model');
const UserModel = require('../models/user.model');
const ApplicationService = require('./application.service');

class DepartmentService extends ApplicationService {
    async createDepartment(departmentData, creatorId) {
        try {
            // Check if department name already exists in company
            const existingDepartment = await DepartmentModel.query(
                'SELECT * FROM departments WHERE company_id = ? AND department_name = ?',
                [departmentData.company_id, departmentData.department_name]
            );

            if (existingDepartment.length > 0) {
                return this.error('Department name already exists in this company');
            }

            const result = await DepartmentModel.create(departmentData);
            const departmentId = result.insertId;

            const [newDepartment] = await DepartmentModel.findById(departmentId);
            return this.success(newDepartment, 'Department created successfully');
        } catch (error) {
            console.error('Create department error:', error);
            return this.error('Failed to create department');
        }
    }

    async updateDepartment(departmentId, departmentData, updaterId) {
        try {
            const [department] = await DepartmentModel.findById(departmentId);
            if (!department) {
                return this.error('Department not found');
            }

            // Check if new name conflicts with existing departments
            if (departmentData.department_name &&
                departmentData.department_name !== department.department_name) {
                const existingDepartment = await DepartmentModel.query(
                    'SELECT * FROM departments WHERE company_id = ? AND department_name = ? AND id != ?',
                    [department.company_id, departmentData.department_name, departmentId]
                );

                if (existingDepartment.length > 0) {
                    return this.error('Department name already exists in this company');
                }
            }

            await DepartmentModel.update(departmentId, departmentData);
            const [updatedDepartment] = await DepartmentModel.findById(departmentId);

            return this.success(updatedDepartment, 'Department updated successfully');
        } catch (error) {
            console.error('Update department error:', error);
            return this.error('Failed to update department');
        }
    }

    async deleteDepartment(departmentId, deleterId) {
        try {
            const [department] = await DepartmentModel.findById(departmentId);
            if (!department) {
                return this.error('Department not found');
            }

            // Check if department has employees
            const [hasEmployees] = await DepartmentModel.hasEmployees(departmentId);
            if (hasEmployees.count > 0) {
                return this.error('Cannot delete department with employees. Reassign employees first.');
            }

            await DepartmentModel.delete(departmentId);
            return this.success(null, 'Department deleted successfully');
        } catch (error) {
            console.error('Delete department error:', error);
            return this.error('Failed to delete department');
        }
    }

    async getDepartments(companyId) {
        try {
            const departments = await DepartmentModel.getWithEmployeeCount(companyId);
            return this.success(departments, 'Departments retrieved successfully');
        } catch (error) {
            console.error('Get departments error:', error);
            return this.error('Failed to retrieve departments');
        }
    }

    async getDepartment(departmentId) {
        try {
            const [department] = await DepartmentModel.findById(departmentId);
            if (!department) {
                return this.error('Department not found');
            }

            // Get department employees
            const employees = await UserModel.query(
                `SELECT id, first_name, last_name, email, position, hire_date, status 
                 FROM users 
                 WHERE department_id = ? AND status = 'active'
                 ORDER BY first_name`,
                [departmentId]
            );

            // Get department statistics
            const [stats] = await DepartmentModel.query(
                `SELECT 
                    COUNT(*) as total_employees,
                    AVG(salary) as avg_salary,
                    SUM(salary) as total_salary_budget
                 FROM users 
                 WHERE department_id = ? AND status = 'active'`,
                [departmentId]
            );

            return this.success({
                ...department,
                employees,
                statistics: stats
            }, 'Department details retrieved');
        } catch (error) {
            console.error('Get department error:', error);
            return this.error('Failed to retrieve department');
        }
    }

    async reassignEmployees(departmentId, newDepartmentId, reassignerId) {
        try {
            // Check if both departments exist
            const [oldDept] = await DepartmentModel.findById(departmentId);
            const [newDept] = await DepartmentModel.findById(newDepartmentId);

            if (!oldDept || !newDept) {
                return this.error('One or both departments not found');
            }

            if (oldDept.company_id !== newDept.company_id) {
                return this.error('Cannot reassign employees to a department in another company');
            }

            // Update employees' department
            await UserModel.query(
                'UPDATE users SET department_id = ? WHERE department_id = ?',
                [newDepartmentId, departmentId]
            );

            return this.success({
                from_department: oldDept.department_name,
                to_department: newDept.department_name,
                affected_employees: await this.getDepartmentEmployeeCount(departmentId)
            }, 'Employees reassigned successfully');
        } catch (error) {
            console.error('Reassign employees error:', error);
            return this.error('Failed to reassign employees');
        }
    }

    async getDepartmentEmployeeCount(departmentId) {
        const [result] = await DepartmentModel.query(
            'SELECT COUNT(*) as count FROM users WHERE department_id = ? AND status = "active"',
            [departmentId]
        );
        return result.count;
    }

    async updateDepartmentManager(departmentId, managerId, updaterId) {
        try {
            const [department] = await DepartmentModel.findById(departmentId);
            if (!department) {
                return this.error('Department not found');
            }

            // Check if manager exists and belongs to same company
            const [manager] = await UserModel.findById(managerId);
            if (!manager || manager.company_id !== department.company_id) {
                return this.error('Invalid manager');
            }

            await DepartmentModel.update(departmentId, { manager_id: managerId });

            // Update manager's position if needed
            await UserModel.update(managerId, {
                position: `Manager - ${department.department_name}`
            });

            return this.success({ manager_id: managerId }, 'Department manager updated');
        } catch (error) {
            console.error('Update manager error:', error);
            return this.error('Failed to update department manager');
        }
    }
}

module.exports = new DepartmentService();