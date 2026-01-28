//app/services/salary.service.js
const SalaryModel = require('../models/salary.model');
const UserModel = require('../models/user.model');
const moment = require('moment');
const ApplicationService = require('./application.service');

class SalaryService extends ApplicationService {
    async generateSalary(salaryData, generatorId) {
        try {
            // Check if salary already exists for this user and month
            const [exists] = await SalaryModel.exists(salaryData.user_id, salaryData.month);
            if (exists.count > 0) {
                return this.error('Salary already generated for this month');
            }

            // Verify user exists
            const [user] = await UserModel.findById(salaryData.user_id);
            if (!user) {
                return this.error('User not found');
            }

            // Calculate total amount if not provided
            if (!salaryData.total_amount) {
                salaryData.total_amount = (salaryData.basic_salary || user.salary || 0) +
                    (salaryData.bonus || 0) -
                    (salaryData.deductions || 0);
            }

            const result = await SalaryModel.create(salaryData);
            return this.success({
                id: result.insertId,
                total_amount: salaryData.total_amount
            }, 'Salary generated successfully');
        } catch (error) {
            console.error('Generate salary error:', error);
            return this.error('Failed to generate salary');
        }
    }

    async getSalaries(userId) {
        try {
            const salaries = await SalaryModel.getByUser(userId);
            return this.success(salaries, 'Salaries retrieved successfully');
        } catch (error) {
            console.error('Get salaries error:', error);
            return this.error('Failed to retrieve salaries');
        }
    }

    async getSalaryDetails(salaryId) {
        try {
            const [salary] = await SalaryModel.findById(salaryId);
            if (!salary) {
                return this.error('Salary record not found');
            }
            return this.success(salary, 'Salary details retrieved');
        } catch (error) {
            console.error('Get salary details error:', error);
            return this.error('Failed to retrieve salary details');
        }
    }

    async getCompanySalaries(companyId, month = null) {
        try {
            const targetMonth = month || moment().format('YYYYMM');
            const salaries = await SalaryModel.getByCompanyAndMonth(companyId, targetMonth);

            const totals = {
                total_basic: salaries.reduce((sum, s) => sum + parseFloat(s.basic_salary), 0),
                total_bonus: salaries.reduce((sum, s) => sum + parseFloat(s.bonus), 0),
                total_deductions: salaries.reduce((sum, s) => sum + parseFloat(s.deductions), 0),
                total_amount: salaries.reduce((sum, s) => sum + parseFloat(s.total_amount), 0),
                paid_amount: salaries.filter(s => s.payment_status === 'paid')
                    .reduce((sum, s) => sum + parseFloat(s.total_amount), 0),
                pending_amount: salaries.filter(s => s.payment_status === 'pending')
                    .reduce((sum, s) => sum + parseFloat(s.total_amount), 0)
            };

            return this.success({
                salaries,
                totals,
                month: targetMonth
            }, 'Company salaries retrieved');
        } catch (error) {
            console.error('Get company salaries error:', error);
            return this.error('Failed to retrieve salaries');
        }
    }

    async updateSalaryStatus(salaryId, statusData, updaterId) {
        try {
            const [salary] = await SalaryModel.findById(salaryId);
            if (!salary) {
                return this.error('Salary record not found');
            }

            const validStatuses = ['pending', 'paid', 'partially_paid'];
            if (!validStatuses.includes(statusData.status)) {
                return this.error('Invalid payment status');
            }

            await SalaryModel.updateStatus(
                salaryId,
                statusData.status,
                statusData.payment_date || null
            );

            const [updatedSalary] = await SalaryModel.findById(salaryId);
            return this.success(updatedSalary, 'Salary status updated');
        } catch (error) {
            console.error('Update salary status error:', error);
            return this.error('Failed to update salary status');
        }
    }

    async updateSalary(salaryId, salaryData, updaterId) {
        try {
            const [salary] = await SalaryModel.findById(salaryId);
            if (!salary) {
                return this.error('Salary record not found');
            }

            if (salary.payment_status === 'paid') {
                return this.error('Cannot update paid salary');
            }

            // Recalculate total if basic, bonus or deductions changed
            if (salaryData.basic_salary || salaryData.bonus || salaryData.deductions) {
                const newBasic = salaryData.basic_salary || salary.basic_salary;
                const newBonus = salaryData.bonus || salary.bonus;
                const newDeductions = salaryData.deductions || salary.deductions;
                salaryData.total_amount = newBasic + newBonus - newDeductions;
            }

            await SalaryModel.update(salaryId, salaryData);
            const [updatedSalary] = await SalaryModel.findById(salaryId);

            return this.success(updatedSalary, 'Salary updated successfully');
        } catch (error) {
            console.error('Update salary error:', error);
            return this.error('Failed to update salary');
        }
    }

    async getSalarySummary(companyId, year = null) {
        try {
            const targetYear = year || moment().year();
            const summary = await SalaryModel.getSalarySummary(companyId, targetYear);
            return this.success(summary, 'Salary summary retrieved');
        } catch (error) {
            console.error('Get salary summary error:', error);
            return this.error('Failed to retrieve salary summary');
        }
    }

    async getPendingSalaries(companyId) {
        try {
            const salaries = await SalaryModel.getPendingSalaries(companyId);
            return this.success(salaries, 'Pending salaries retrieved');
        } catch (error) {
            console.error('Get pending salaries error:', error);
            return this.error('Failed to retrieve pending salaries');
        }
    }

    async bulkGenerateSalaries(companyId, month, generatorId) {
        try {
            // Get all active employees
            const employees = await UserModel.findAllActive(companyId);

            const results = {
                success: 0,
                failed: 0,
                already_exists: 0,
                salaries: []
            };

            for (const employee of employees) {
                try {
                    // Check if salary already exists
                    const [exists] = await SalaryModel.exists(employee.id, month);
                    if (exists.count > 0) {
                        results.already_exists++;
                        continue;
                    }

                    // Generate salary record
                    const salaryData = {
                        user_id: employee.id,
                        company_id: companyId,
                        month: month,
                        basic_salary: employee.salary || 0,
                        bonus: employee.bonus || 0,
                        deductions: 0,
                        total_amount: (employee.salary || 0) + (employee.bonus || 0)
                    };

                    await SalaryModel.create(salaryData);
                    results.success++;
                    results.salaries.push({
                        employee_id: employee.id,
                        name: `${employee.first_name} ${employee.last_name}`,
                        amount: salaryData.total_amount
                    });
                } catch (error) {
                    console.error(`Failed to generate salary for employee ${employee.id}:`, error);
                    results.failed++;
                }
            }

            return this.success(results, 'Bulk salary generation completed');
        } catch (error) {
            console.error('Bulk generate salaries error:', error);
            return this.error('Failed to generate salaries in bulk');
        }
    }
}

module.exports = new SalaryService();