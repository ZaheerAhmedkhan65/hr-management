// app/models/department.model.js
const ApplicationModel = require('./application.model');

class DepartmentModel extends ApplicationModel {
    // Find department by ID
    static findById(id) {
        return this.query('SELECT * FROM departments WHERE id = ?', [id]);
    }

    // Find departments by company
    static findByCompany(companyId) {
        return this.query(
            `SELECT d.*, u.first_name, u.last_name 
             FROM departments d 
             LEFT JOIN users u ON d.manager_id = u.id 
             WHERE d.company_id = ? 
             ORDER BY d.department_name`,
            [companyId]
        );
    }

    // Create new department
    static create(departmentData) {
        const { company_id, department_name, description, manager_id } = departmentData;

        return this.query(
            'INSERT INTO departments (company_id, department_name, description, manager_id) VALUES (?, ?, ?, ?)',
            [company_id, department_name, description, manager_id]
        );
    }

    // Update department
    static update(id, departmentData) {
        const fields = [];
        const values = [];

        Object.keys(departmentData).forEach(key => {
            if (departmentData[key] !== undefined) {
                fields.push(`${key} = ?`);
                values.push(departmentData[key]);
            }
        });

        values.push(id);

        return this.query(
            `UPDATE departments SET ${fields.join(', ')} WHERE id = ?`,
            values
        );
    }

    // Delete department
    static delete(id) {
        return this.query('DELETE FROM departments WHERE id = ?', [id]);
    }

    // Get department with employee count
    static getWithEmployeeCount(companyId) {
        return this.query(
            `SELECT d.*, 
                    COUNT(u.id) as employee_count,
                    CONCAT(m.first_name, ' ', m.last_name) as manager_name
             FROM departments d
             LEFT JOIN users u ON d.id = u.department_id AND u.status = 'active'
             LEFT JOIN users m ON d.manager_id = m.id
             WHERE d.company_id = ?
             GROUP BY d.id
             ORDER BY d.department_name`,
            [companyId]
        );
    }

    // Check if department has employees
    static hasEmployees(id) {
        return this.query(
            'SELECT COUNT(*) as count FROM users WHERE department_id = ? AND status = "active"',
            [id]
        );
    }
}

module.exports = DepartmentModel;