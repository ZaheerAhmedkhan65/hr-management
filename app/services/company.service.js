//app/services/company.service.js
const CompanyModel = require('../models/company.model');
const UserModel = require('../models/user.model');
const ApplicationService = require('./application.service');

class CompanyService extends ApplicationService {
    async createCompany(companyData, adminData) {
        try {
            // Check if company email exists
            const existingCompany = await CompanyModel.findByEmail(companyData.company_email);
            if (existingCompany.length > 0) {
                return this.error('Company email already registered');
            }

            // Check if tax ID exists
            if (companyData.tax_id) {
                const existingTaxId = await CompanyModel.findByTaxId(companyData.tax_id);
                if (existingTaxId.length > 0) {
                    return this.error('Tax ID already registered');
                }
            }

            const result = await CompanyModel.create(companyData);
            return this.success({ id: result.insertId, ...companyData }, 'Company created successfully');
        } catch (error) {
            console.error('Create company error:', error);
            return this.error('Failed to create company');
        }
    }

    async updateCompany(companyId, companyData, updaterId) {
        try {
            const [company] = await CompanyModel.findById(companyId);
            if (!company) {
                return this.error('Company not found');
            }

            // Check if new email conflicts with existing companies
            if (companyData.company_email && companyData.company_email !== company.company_email) {
                const existingCompany = await CompanyModel.findByEmail(companyData.company_email);
                if (existingCompany.length > 0 && existingCompany[0].id !== companyId) {
                    return this.error('Company email already in use');
                }
            }

            await CompanyModel.update(companyId, companyData);
            const [updatedCompany] = await CompanyModel.findById(companyId);

            return this.success(updatedCompany, 'Company updated successfully');
        } catch (error) {
            console.error('Update company error:', error);
            return this.error('Failed to update company');
        }
    }

    async getCompany(companyId) {
        try {
            const [company] = await CompanyModel.findById(companyId);
            if (!company) {
                return this.error('Company not found');
            }

            // Get company statistics
            const [employeeCount] = await UserModel.countByRole(companyId, 'employee');
            const [activeUsers] = await UserModel.query(
                'SELECT COUNT(*) as count FROM users WHERE company_id = ? AND status = "active"',
                [companyId]
            );

            return this.success({
                ...company,
                statistics: {
                    total_employees: employeeCount.count,
                    active_users: activeUsers.count
                }
            }, 'Company retrieved successfully');
        } catch (error) {
            console.error('Get company error:', error);
            return this.error('Failed to retrieve company');
        }
    }

    async getAllCompanies(filters = {}) {
        try {
            let companies;

            if (filters.status) {
                companies = await CompanyModel.query(
                    'SELECT * FROM companies WHERE status = ? ORDER BY company_name',
                    [filters.status]
                );
            } else if (filters.plan) {
                companies = await CompanyModel.findByPlan(filters.plan);
            } else {
                companies = await CompanyModel.findAll();
            }

            // Get employee count for each company
            const companiesWithStats = await Promise.all(
                companies.map(async (company) => {
                    const [employeeCount] = await UserModel.query(
                        'SELECT COUNT(*) as count FROM users WHERE company_id = ?',
                        [company.id]
                    );
                    return {
                        ...company,
                        employee_count: employeeCount.count
                    };
                })
            );

            const total = companies.length;
            return this.success({
                companies: companiesWithStats,
                total,
                page: filters.page || 1,
                limit: filters.limit || 20,
                pages: Math.ceil(total / (filters.limit || 20))
            }, 'Companies retrieved successfully');
        } catch (error) {
            console.error('Get companies error:', error);
            return this.error('Failed to retrieve companies');
        }
    }

    async updateCompanyStatus(companyId, status, updaterId) {
        try {
            const [company] = await CompanyModel.findById(companyId);
            if (!company) {
                return this.error('Company not found');
            }

            const validStatuses = ['active', 'inactive'];
            if (!validStatuses.includes(status)) {
                return this.error('Invalid status');
            }

            await CompanyModel.updateStatus(companyId, status);

            // If deactivating company, also deactivate all users
            if (status === 'inactive') {
                await UserModel.query(
                    'UPDATE users SET status = "inactive" WHERE company_id = ?',
                    [companyId]
                );
            }

            return this.success({ status }, 'Company status updated successfully');
        } catch (error) {
            console.error('Update status error:', error);
            return this.error('Failed to update company status');
        }
    }

    async updateSubscription(companyId, subscriptionData, updaterId) {
        try {
            const [company] = await CompanyModel.findById(companyId);
            if (!company) {
                return this.error('Company not found');
            }

            const validPlans = ['free', 'basic', 'premium'];
            if (!validPlans.includes(subscriptionData.plan)) {
                return this.error('Invalid subscription plan');
            }

            await CompanyModel.updateSubscription(
                companyId,
                subscriptionData.plan,
                subscriptionData.expiry || null
            );

            return this.success(subscriptionData, 'Subscription updated successfully');
        } catch (error) {
            console.error('Update subscription error:', error);
            return this.error('Failed to update subscription');
        }
    }

    async getCompanyStats() {
        try {
            const [totalStats] = await CompanyModel.query(
                `SELECT 
                    COUNT(*) as total_companies,
                    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_companies,
                    SUM(CASE WHEN subscription_plan = 'free' THEN 1 ELSE 0 END) as free_plans,
                    SUM(CASE WHEN subscription_plan = 'basic' THEN 1 ELSE 0 END) as basic_plans,
                    SUM(CASE WHEN subscription_plan = 'premium' THEN 1 ELSE 0 END) as premium_plans,
                    SUM(CASE WHEN subscription_expiry < CURDATE() THEN 1 ELSE 0 END) as expired_plans
                 FROM companies`
            );

            return this.success(totalStats, 'Statistics retrieved successfully');
        } catch (error) {
            console.error('Get company stats error:', error);
            return this.error('Failed to retrieve statistics');
        }
    }
}

module.exports = new CompanyService();