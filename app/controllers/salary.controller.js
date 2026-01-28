const SalaryService = require('../services/salary.service');
const ApplicationController = require('./application.controller');

class SalaryController extends ApplicationController {
    constructor() {
        super(SalaryService);
    }

    // Get my salaries
    async getMySalaries(req, res) {
        try {
            const userId = req.user.id;
            const filters = {
                month: req.query.month,
                status: req.query.status
            };

            const result = await this.service.getSalaries(userId);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            // Filter salaries if needed
            let salaries = result.data;
            if (filters.status && filters.status !== 'all') {
                salaries = salaries.filter(salary => salary.payment_status === filters.status);
            }
            if (filters.month) {
                salaries = salaries.filter(salary => salary.month === filters.month);
            }

            // Calculate summary
            const summary = this.calculateSalarySummary(salaries);

            // For web requests
            if (!req.xhr && !req.headers.accept?.includes('application/json')) {
                return res.render('salaries/my', {
                    title: 'My Salaries',
                    salaries: salaries,
                    summary: summary,
                    filters
                });
            }

            return this.success(res, { salaries, summary, filters }, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Get my salary details
    async getMySalaryDetails(req, res) {
        try {
            const salaryId = req.params.salaryId;
            const userId = req.user.id;

            const result = await this.service.getSalaryDetails(salaryId);

            if (!result.success) {
                return this.error(res, result.message, 404);
            }

            // Check permission
            if (!this.hasSalaryAccess(req.user, result.data)) {
                return this.error(res, 'Access denied', 403);
            }

            // For web requests
            if (!req.xhr && !req.headers.accept?.includes('application/json')) {
                return res.render('salaries/details', {
                    title: 'Salary Details',
                    salary: result.data
                });
            }

            return this.success(res, result.data, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Generate salary (HR/Admin)
    async generateSalary(req, res) {
        try {
            const salaryData = req.body;
            salaryData.company_id = req.user.companyId;

            const result = await this.service.generateSalary(salaryData, req.user.id);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            return this.success(res, result.data, result.message, 201);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Bulk generate salaries (HR/Admin)
    async bulkGenerateSalaries(req, res) {
        try {
            const { month, department_id } = req.body;
            const companyId = req.user.companyId;

            const result = await this.service.bulkGenerateSalaries(companyId, month, req.user.id);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            return this.success(res, result.data, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Update salary (HR/Admin)
    async updateSalary(req, res) {
        try {
            const salaryId = req.params.salaryId;
            const salaryData = req.body;

            // Get salary details first to check permission
            const salaryDetails = await this.service.getSalaryDetails(salaryId);

            if (!salaryDetails.success) {
                return this.error(res, salaryDetails.message, 404);
            }

            // Check permission
            if (!this.canUpdateSalary(req.user, salaryDetails.data)) {
                return this.error(res, 'Access denied', 403);
            }

            const result = await this.service.updateSalary(salaryId, salaryData, req.user.id);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            return this.success(res, result.data, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Update salary status (HR/Admin)
    async updateSalaryStatus(req, res) {
        try {
            const salaryId = req.params.salaryId;
            const statusData = req.body;

            // Get salary details first to check permission
            const salaryDetails = await this.service.getSalaryDetails(salaryId);

            if (!salaryDetails.success) {
                return this.error(res, salaryDetails.message, 404);
            }

            // Check permission
            if (!this.canUpdateSalaryStatus(req.user, salaryDetails.data)) {
                return this.error(res, 'Access denied', 403);
            }

            const result = await this.service.updateSalaryStatus(salaryId, statusData, req.user.id);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            return this.success(res, result.data, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Get company salaries (HR/Admin)
    async getCompanySalaries(req, res) {
        try {
            const companyId = req.params.companyId || req.user.companyId;
            const filters = {
                month: req.query.month,
                status: req.query.status
            };

            // Check permission
            if (!this.hasCompanyAccess(req.user, companyId)) {
                return this.error(res, 'Access denied', 403);
            }

            const result = await this.service.getCompanySalaries(companyId, filters.month);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            // Filter salaries if needed
            let salaries = result.data.salaries;
            if (filters.status && filters.status !== 'all') {
                salaries = salaries.filter(salary => salary.payment_status === filters.status);
            }

            // Update totals
            const totals = this.calculateSalaryTotals(salaries);

            // For web requests
            if (!req.xhr && !req.headers.accept?.includes('application/json')) {
                return res.render('salaries/company', {
                    title: 'Company Salaries',
                    salaries: salaries,
                    totals: totals,
                    month: filters.month || result.data.month,
                    filters
                });
            }

            return this.success(res, { salaries, totals, ...result.data }, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Get salary report
    async getSalaryReport(req, res) {
        try {
            const companyId = req.params.companyId || req.user.companyId;
            const filters = {
                year: req.query.year || new Date().getFullYear()
            };

            // Check permission
            if (!this.hasCompanyAccess(req.user, companyId)) {
                return this.error(res, 'Access denied', 403);
            }

            const result = await this.service.getSalarySummary(companyId, filters.year);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            // For web requests
            if (!req.xhr && !req.headers.accept?.includes('application/json')) {
                return res.render('salaries/report', {
                    title: 'Salary Report',
                    report: result.data,
                    filters
                });
            }

            return this.success(res, result.data, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Get user salary report
    async getUserSalaryReport(req, res) {
        try {
            const userId = req.params.userId;
            const filters = {
                year: req.query.year || new Date().getFullYear()
            };

            // Check permission
            if (!this.hasUserAccess(req.user, userId)) {
                return this.error(res, 'Access denied', 403);
            }

            const salaries = await this.service.getSalaries(userId);

            if (!salaries.success) {
                return this.error(res, salaries.message, 400);
            }

            // Filter by year
            const filteredSalaries = salaries.data.filter(salary => {
                return salary.month.startsWith(filters.year.toString());
            });

            // Calculate report
            const report = this.generateUserSalaryReport(filteredSalaries, filters.year);

            return this.success(res, report, 'Salary report generated');

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Get salary summary
    async getSalarySummary(req, res) {
        try {
            const companyId = req.params.companyId || req.user.companyId;
            const year = req.query.year || new Date().getFullYear();

            // Check permission
            if (!this.hasCompanyAccess(req.user, companyId)) {
                return this.error(res, 'Access denied', 403);
            }

            const result = await this.service.getSalarySummary(companyId, year);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            return this.success(res, result.data, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Get pending salaries
    async getPendingSalaries(req, res) {
        try {
            const companyId = req.user.companyId;

            const result = await this.service.getPendingSalaries(companyId);

            if (!result.success) {
                return this.error(res, result.message, 400);
            }

            // For web requests
            if (!req.xhr && !req.headers.accept?.includes('application/json')) {
                return res.render('salaries/pending', {
                    title: 'Pending Salaries',
                    salaries: result.data
                });
            }

            return this.success(res, result.data, result.message);

        } catch (error) {
            return this.handleError(res, error);
        }
    }

    // Download payslip
    async downloadPayslip(req, res) {
        try {
            const salaryId = req.params.salaryId;

            const result = await this.service.getSalaryDetails(salaryId);

            if (!result.success) {
                return this.error(res, result.message, 404);
            }

            // Check permission
            if (!this.hasSalaryAccess(req.user, result.data)) {
                return this.error(res, 'Access denied', 403);
            }

            // Generate PDF (this would typically use a PDF generation library)
            const payslipData = this.generatePayslipData(result.data);

            // For now, return JSON
            // In production, you would generate a PDF file
            return this.success(res, payslipData, 'Payslip data retrieved');

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

    hasUserAccess(currentUser, targetUserId) {
        if (currentUser.role === 'admin') return true;
        if (currentUser.role === 'hr' && currentUser.companyId) return true;
        if (currentUser.id === parseInt(targetUserId)) return true;
        return false;
    }

    hasSalaryAccess(currentUser, salary) {
        if (currentUser.role === 'admin') return true;
        if (currentUser.role === 'hr' && currentUser.companyId === salary.company_id) return true;
        if (currentUser.id === salary.user_id) return true;
        return false;
    }

    canUpdateSalary(currentUser, salary) {
        if (currentUser.role === 'admin') return true;
        if (currentUser.role === 'hr' && currentUser.companyId === salary.company_id) return true;
        return false;
    }

    canUpdateSalaryStatus(currentUser, salary) {
        if (currentUser.role === 'admin') return true;
        if (currentUser.role === 'hr' && currentUser.companyId === salary.company_id) return true;
        return false;
    }

    // Calculate salary summary
    calculateSalarySummary(salaries) {
        const summary = {
            total_salaries: salaries.length,
            total_amount: 0,
            paid_amount: 0,
            pending_amount: 0,
            average_salary: 0,
            by_month: {}
        };

        salaries.forEach(salary => {
            const amount = parseFloat(salary.total_amount) || 0;
            summary.total_amount += amount;

            if (salary.payment_status === 'paid') {
                summary.paid_amount += amount;
            } else {
                summary.pending_amount += amount;
            }

            // Group by month
            const month = salary.month;
            if (!summary.by_month[month]) {
                summary.by_month[month] = {
                    count: 0,
                    amount: 0
                };
            }
            summary.by_month[month].count++;
            summary.by_month[month].amount += amount;
        });

        if (salaries.length > 0) {
            summary.average_salary = summary.total_amount / salaries.length;
        }

        return summary;
    }

    // Calculate salary totals
    calculateSalaryTotals(salaries) {
        const totals = {
            total_basic: 0,
            total_bonus: 0,
            total_deductions: 0,
            total_amount: 0,
            paid_amount: 0,
            pending_amount: 0,
            employee_count: salaries.length
        };

        salaries.forEach(salary => {
            totals.total_basic += parseFloat(salary.basic_salary) || 0;
            totals.total_bonus += parseFloat(salary.bonus) || 0;
            totals.total_deductions += parseFloat(salary.deductions) || 0;

            const total = parseFloat(salary.total_amount) || 0;
            totals.total_amount += total;

            if (salary.payment_status === 'paid') {
                totals.paid_amount += total;
            } else {
                totals.pending_amount += total;
            }
        });

        return totals;
    }

    // Generate user salary report
    generateUserSalaryReport(salaries, year) {
        const monthlyData = {};
        const summary = {
            total_earned: 0,
            total_bonus: 0,
            total_deductions: 0,
            average_salary: 0,
            months_paid: 0
        };

        // Initialize months
        for (let i = 1; i <= 12; i++) {
            const month = `${year}${i.toString().padStart(2, '0')}`;
            monthlyData[month] = {
                basic_salary: 0,
                bonus: 0,
                deductions: 0,
                total_amount: 0,
                status: 'unpaid'
            };
        }

        // Process salaries
        salaries.forEach(salary => {
            const month = salary.month;
            if (monthlyData[month]) {
                monthlyData[month].basic_salary = parseFloat(salary.basic_salary) || 0;
                monthlyData[month].bonus = parseFloat(salary.bonus) || 0;
                monthlyData[month].deductions = parseFloat(salary.deductions) || 0;
                monthlyData[month].total_amount = parseFloat(salary.total_amount) || 0;
                monthlyData[month].status = salary.payment_status;

                // Update summary
                summary.total_earned += monthlyData[month].total_amount;
                summary.total_bonus += monthlyData[month].bonus;
                summary.total_deductions += monthlyData[month].deductions;

                if (salary.payment_status === 'paid') {
                    summary.months_paid++;
                }
            }
        });

        if (summary.months_paid > 0) {
            summary.average_salary = summary.total_earned / summary.months_paid;
        }

        return {
            year,
            monthly_data: monthlyData,
            summary,
            salaries: salaries.slice(0, 12) // Last 12 months
        };
    }

    // Generate payslip data
    generatePayslipData(salary) {
        return {
            employee: {
                name: `${salary.employee_name}`,
                employee_id: salary.employee_id || 'N/A',
                department: salary.department_name || 'N/A',
                position: salary.position || 'N/A'
            },
            salary: {
                month: salary.month,
                basic_salary: salary.basic_salary,
                bonus: salary.bonus,
                deductions: salary.deductions,
                total_amount: salary.total_amount,
                payment_status: salary.payment_status,
                payment_date: salary.payment_date
            },
            company: {
                name: 'Your Company Name',
                address: 'Company Address',
                tax_id: 'Tax ID'
            },
            breakdown: {
                earnings: [
                    { description: 'Basic Salary', amount: salary.basic_salary },
                    { description: 'Bonus', amount: salary.bonus }
                ],
                deductions: [
                    { description: 'Tax', amount: salary.deductions * 0.7 },
                    { description: 'Insurance', amount: salary.deductions * 0.3 }
                ]
            },
            net_pay: salary.total_amount,
            generated_date: new Date().toISOString().split('T')[0]
        };
    }
}

module.exports = new SalaryController();